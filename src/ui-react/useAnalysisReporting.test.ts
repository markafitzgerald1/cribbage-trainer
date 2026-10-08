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

// Telemetry and the tally wired as Trainer wires them: the defect lives in the seam, since only the pair can disagree about which hand occurrence is showing.
const startReporting = (
  initial: BoardProps,
  { isSeededSession = false, wasDeepLinked = false }: StartOptions = {},
) => {
  clearDiscardTally();
  const trackEvent = jest.fn<TrackEvent>();
  return renderHook(
    ({ dealtCards, sortOrder }: BoardProps) =>
      useAnalysisReporting({
        choice: {
          consented: false,
          decisionContextConsented: false,
          decisionQualityConsented: false,
          needsPolicyUpdateChoice: false,
        },
        cribRole: CribRole.Dealer,
        dealtCards,

        isSeededSession,
        sortOrder,
        trackEvent,
        wasDeepLinked,
      }),
    { initialProps: initial },
  );
};

type Reporting = ReturnType<typeof startReporting>;

interface StampedEntry {
  readonly completionSortOrder: SortOrder | null;
  readonly handId: string;
}

// A popstate as Trainer handles it: the entry's scope and capture and the restored board arrive in one update.
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
// Back onto an entry an earlier build wrote: a scope but no capture.
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
  {
    move: [backOntoEntryWithoutCapture],
    name: "a Back onto an entry recording no capture",
    wanted: "ascending",
  },
];

// Two re-sorts push entries, then the given history move, then the score, as when the tables are still loading; a restore onto a re-sort's entry takes back the completion's order.
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

// A cross-hand Back makes telemetry open a fresh scope that Trainer stamps over the restored entry.
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
  // Never opened for skip counting, which must not read as a different hand when Back names the page load's scope.
  {
    origin: "a deep-linked first hand",
    start: completedFirstHand({ wasDeepLinked: true }),
  },
];

describe("the hand identity telemetry and the tally share", () => {
  // A capture keyed on anything but telemetry's current scope would be retaken on a re-sort or same-hand move; each case covers one way the hand can have been opened.
  it.each(
    origins.flatMap((origin) => moves.map((move) => ({ ...origin, ...move }))),
  )(
    "records $wanted after two re-sorts and $name, for $origin",
    ({ move, start, wanted }) => {
      expect(resortTwiceMoveAndScore(start(), move)).toBe(wanted);
    },
  );
});
