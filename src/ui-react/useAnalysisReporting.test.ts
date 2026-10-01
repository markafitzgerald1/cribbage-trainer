/* jscpd:ignore-start */
import { HAND, OTHER_HAND, handOf } from "./useDiscardTally.test.common";
import { act, renderHook } from "@testing-library/react";
import { clearDiscardTally, readTallyForDisplay } from "../ui/discardTally";
import { describe, expect, it, jest } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { SortOrder } from "../ui/SortOrder";
import type { TrackEvent } from "../ui/trackEvent";
import { useAnalysisReporting } from "./useAnalysisReporting";
/* jscpd:ignore-end */

interface BoardProps {
  readonly dealtCards: readonly DealtCard[];
  readonly sortOrder: SortOrder;
}

interface StartOptions {
  readonly isSeededSession?: boolean;
  readonly wasDeepLinked?: boolean;
}

/*
 * Telemetry and the tally wired together as Trainer wires them, because the
 * defect this suite guards lives in the seam: each reader alone is correct
 * about the identifier it is handed, and only the pair can disagree about
 * which hand occurrence the board is showing.
 */
const startReporting = (
  initial: BoardProps,
  { isSeededSession = false, wasDeepLinked = false }: StartOptions = {},
) => {
  clearDiscardTally();
  const trackEvent = jest.fn<TrackEvent>();
  return renderHook(
    ({ dealtCards, sortOrder }: BoardProps) =>
      useAnalysisReporting({
        consented: false,
        cribRole: CribRole.Dealer,
        dealtCards,
        decisionQualityConsented: false,
        isSeededSession,
        sortOrder,
        trackEvent,
        wasDeepLinked,
      }),
    { initialProps: initial },
  );
};

type Reporting = ReturnType<typeof startReporting>;

// What Trainer's history effect writes onto an entry after every change: telemetry's scope and the tally's capture.
interface StampedEntry {
  readonly completionSortOrder: SortOrder | null;
  readonly handId: string;
}

/*
 * A popstate as Trainer handles it: the entry's scope and capture and the
 * board it restores arrive in one update. Both are whatever Trainer stamped
 * onto that entry, which is always their value at the time it was written.
 */
const navigateHistory = (
  reporting: Reporting,
  { completionSortOrder, handId }: StampedEntry,
  board: BoardProps,
) => {
  act(() => {
    reporting.result.current.reportHistoryNavigation(
      board.dealtCards,
      { completionSortOrder, handScope: { generatedFromSeed: false, handId } },
      CribRole.Dealer,
    );
    reporting.rerender(board);
  });
};

const stampedEntry = (reporting: Reporting): StampedEntry => ({
  completionSortOrder: reporting.result.current.completionSortOrder,
  handId: reporting.result.current.currentHandScope().handId,
});

// The entries the two re-sorts below push, each still showing the completed discard.
interface ResortEntries {
  readonly ascending: StampedEntry;
  readonly dealOrder: StampedEntry;
}

type HistoryMove = (reporting: Reporting, entries: ResortEntries) => void;

const restoreCompleted =
  (sortOrder: SortOrder, entryOf: (entries: ResortEntries) => StampedEntry) =>
  (reporting: Reporting, entries: ResortEntries) => {
    navigateHistory(reporting, entryOf(entries), {
      dealtCards: handOf(HAND, true),
      sortOrder,
    });
  };

const back = restoreCompleted(
  SortOrder.Ascending,
  (entries) => entries.ascending,
);
const forward = restoreCompleted(
  SortOrder.DealOrder,
  (entries) => entries.dealOrder,
);
// The same Back onto an entry an earlier build wrote, which carries a scope but no capture.
const backOntoEntryWithoutCapture = restoreCompleted(
  SortOrder.Ascending,
  (entries) => ({ ...entries.ascending, completionSortOrder: null }),
);

const moves: readonly {
  readonly move: readonly HistoryMove[];
  readonly name: string;
  readonly wanted: string;
}[] = [
  { move: [], name: "no history move", wanted: "descending" },
  { move: [back], name: "a Back", wanted: "descending" },
  {
    move: [back, forward],
    name: "a Back then a Forward",
    wanted: "descending",
  },
  // Falls back to the order the restore shows, the only observed value left.
  {
    move: [backOntoEntryWithoutCapture],
    name: "a Back onto an entry recording no capture",
    wanted: "ascending",
  },
];

/*
 * Two sort changes after the discard completed under descending, each
 * pushing an entry, then the given history move, and only then the score, as
 * it arrives when the expected-points tables are still loading. A re-sort
 * leaves the capture alone, and each re-sort's entry is written holding it,
 * so a restore onto one takes back the completion's order (#874).
 */
const resortTwiceMoveAndScore = (
  reporting: Reporting,
  move: readonly HistoryMove[],
) => {
  const completed = handOf(HAND, true);
  reporting.rerender({ dealtCards: completed, sortOrder: SortOrder.Ascending });
  const ascending = stampedEntry(reporting);
  reporting.rerender({ dealtCards: completed, sortOrder: SortOrder.DealOrder });
  const entries = { ascending, dealOrder: stampedEntry(reporting) };
  move.forEach((step) => {
    step(reporting, entries);
  });
  act(() => {
    reporting.result.current.reportAnalysisRendered(
      {
        cribRole: CribRole.Dealer,
        quality: { expectedPointsLoss: 2, isOptimal: false },
      },
      null,
    );
  });
  return readTallyForDisplay().records[0]?.sortOrder;
};

// Back from another hand to this one's completed discard, which makes telemetry open a fresh scope that Trainer stamps over the restored entry.
const restoredFromAnotherHand = () => {
  const reporting = startReporting({
    dealtCards: handOf(HAND, false),
    sortOrder: SortOrder.Descending,
  });
  const firstHandEntry = stampedEntry(reporting);
  act(() => {
    reporting.result.current.reportHandReplaced(
      handOf(OTHER_HAND, false),
      "deal",
      CribRole.Dealer,
    );
    reporting.rerender({
      dealtCards: handOf(OTHER_HAND, false),
      sortOrder: SortOrder.Descending,
    });
  });
  navigateHistory(reporting, firstHandEntry, {
    dealtCards: handOf(HAND, true),
    sortOrder: SortOrder.Descending,
  });
  return reporting;
};

const completedFirstHand = (options: StartOptions) => () =>
  startReporting(
    { dealtCards: handOf(HAND, true), sortOrder: SortOrder.Descending },
    options,
  );

const origins = [
  { origin: "a cross-hand restore", start: restoredFromAnotherHand },
  {
    origin: "an interactively dealt first hand",
    start: completedFirstHand({}),
  },
  {
    origin: "a seeded session",
    start: completedFirstHand({ isSeededSession: true }),
  },
  // Never opened for skip counting, which must not read as a different hand when Back names the page load's own scope.
  {
    origin: "a deep-linked first hand",
    start: completedFirstHand({ wasDeepLinked: true }),
  },
];

describe("the hand identity telemetry and the tally share", () => {
  /*
   * A capture keyed on anything but telemetry's current scope changes key
   * on a re-sort or a same-hand move and is retaken under whatever order is
   * then showing. Each case pins the rule for every way the hand can have
   * been opened: re-sorts never move the capture, a same-hand restore lands
   * on the order its entry recorded, and one onto an entry recording none
   * lands on the order it shows.
   */
  it.each(
    origins.flatMap((origin) => moves.map((move) => ({ ...origin, ...move }))),
  )(
    "records $wanted after two re-sorts and $name, for $origin",
    ({ move, start, wanted }) => {
      expect(resortTwiceMoveAndScore(start(), move)).toBe(wanted);
    },
  );
});
