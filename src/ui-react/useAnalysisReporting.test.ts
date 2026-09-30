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

/*
 * A popstate as Trainer handles it: the entry's scope and the board it
 * restores arrive in one update. The scope is whatever Trainer stamped onto
 * that entry, which is always telemetry's scope at the time it was written.
 */
const navigateHistory = (
  reporting: Reporting,
  entryHandId: string,
  board: BoardProps,
) => {
  act(() => {
    reporting.result.current.reportHistoryNavigation(
      board.dealtCards,
      { generatedFromSeed: false, handId: entryHandId },
      CribRole.Dealer,
    );
    reporting.rerender(board);
  });
};

// The scope Trainer's history effect stamps onto the entry it writes after every change.
const stampedHandId = (reporting: Reporting) =>
  reporting.result.current.currentHandScope().handId;

/*
 * Two sort changes after the discard completed, each pushing an entry, then
 * Back onto the first of them: the same hand and discard, restored with the
 * intermediate sort order. Only the order shown at completion describes the
 * decision, and the score arrives only now, as it does when the
 * expected-points tables are still loading.
 */
const resortTwiceThenBackAndScore = (reporting: Reporting) => {
  const completed = handOf(HAND, true);
  reporting.rerender({ dealtCards: completed, sortOrder: SortOrder.Ascending });
  const intermediateEntry = stampedHandId(reporting);
  reporting.rerender({ dealtCards: completed, sortOrder: SortOrder.DealOrder });
  navigateHistory(reporting, intermediateEntry, {
    dealtCards: handOf(HAND, true),
    sortOrder: SortOrder.Ascending,
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

describe("the hand identity telemetry and the tally share", () => {
  /*
   * Back to a different hand makes telemetry open a fresh scope, which
   * Trainer then stamps over the restored entry. A capture keyed on anything
   * but that fresh scope — such as the entry's old identifier — changes key
   * on the next same-hand Back and is retaken under the intermediate sort.
   */
  it("keeps the completion sort order across same-hand Backs after a cross-hand restore", () => {
    const reporting = startReporting({
      dealtCards: handOf(HAND, false),
      sortOrder: SortOrder.Descending,
    });
    const firstHandEntry = stampedHandId(reporting);
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

    expect(resortTwiceThenBackAndScore(reporting)).toBe("descending");
  });

  /*
   * The same shape without any replacement at all: a seeded or deep-linked
   * first hand is never opened for skip counting, and that absence must not
   * read as a different hand when Back names the page load's own scope.
   */
  it.each([
    // The control: no restore and nothing unopened, so it passes whether or not the two identities can drift apart.
    { name: "an interactively dealt first hand", options: {} },
    { name: "a seeded session", options: { isSeededSession: true } },
    { name: "a deep-linked first hand", options: { wasDeepLinked: true } },
  ])(
    "keeps the completion sort order across same-hand Backs for $name",
    ({ options }) => {
      const reporting = startReporting(
        { dealtCards: handOf(HAND, true), sortOrder: SortOrder.Descending },
        options,
      );

      expect(resortTwiceThenBackAndScore(reporting)).toBe("descending");
    },
  );
});
