import {
  HAND,
  INITIAL_HAND_ID,
  handOf,
  noteRestore,
  renderTally,
  renderTallyWithMutableCards,
  reportScore,
} from "./useDiscardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import { SortOrder } from "../ui/SortOrder";
import { act } from "@testing-library/react";
import { parseHand } from "../game/Card";
import { readTallyForDisplay } from "../ui/discardTally";
import { toDealtCards } from "../game/toDealtCards";

// The same six cards as HAND with a different discard pair.
const otherDiscardOfHand = () =>
  toDealtCards(parseHand(HAND), parseHand("3H,4H"));

const recordedSortOrder = () => readTallyForDisplay().records[0]?.sortOrder;

type TallyHarness = ReturnType<typeof renderTallyWithMutableCards>;

// Telemetry's identifier for a replacement of the first hand.
const SECOND_OCCURRENCE = "second-occurrence";

const showBoardOf =
  (handId: string) =>
  (
    harness: TallyHarness,
    dealtCards: ReturnType<typeof handOf>,
    sortOrder: SortOrder,
  ) => {
    harness.rerender({ dealtCards, handId, sortOrder });
  };

const showBoard = showBoardOf(INITIAL_HAND_ID);
const showSecondOccurrence = showBoardOf(SECOND_OCCURRENCE);

const completeWithoutScoringUnderDescending = (
  wasDeepLinked = false,
): TallyHarness => {
  const harness = renderTallyWithMutableCards(
    handOf(HAND, false),
    SortOrder.Descending,
    wasDeepLinked,
  );
  showBoard(harness, handOf(HAND, true), SortOrder.Descending);
  return harness;
};

// One act(), as in applyManualHand: two updates would let a render re-capture the old completed discard between them.
const replaceWithSameCards = (harness: TallyHarness) => {
  act(() => {
    harness.result.current.reportHandOrigin(handOf(HAND, false), "manual", {
      cribRole: CribRole.Dealer,
      handId: SECOND_OCCURRENCE,
    });
    showSecondOccurrence(harness, handOf(HAND, false), SortOrder.Descending);
  });
};

const replaceAndCompleteUnderAscending = (harness: TallyHarness) => {
  replaceWithSameCards(harness);
  showSecondOccurrence(harness, handOf(HAND, true), SortOrder.Ascending);
};

const scoreBoard = (
  harness: TallyHarness,
  dealtCards: ReturnType<typeof handOf>,
  sortOrder: SortOrder,
) => {
  showBoard(harness, dealtCards, sortOrder);
  reportScore(harness.result.current);
};

const resortTo = (
  harness: ReturnType<typeof renderTallyWithMutableCards>,
  sortOrder: SortOrder,
) => {
  harness.rerender({ dealtCards: handOf(HAND, true), sortOrder });
};

const resortThenReport = (
  harness: ReturnType<typeof renderTallyWithMutableCards>,
  sortOrder: SortOrder,
) => {
  resortTo(harness, sortOrder);
  reportScore(harness.result.current);
};

// Per value, because SortOrder.DealOrder is 0 and a truthiness bug would drop exactly that row's field.
describe("recording the sort order a discard was completed under", () => {
  it.each([
    { sortOrder: SortOrder.DealOrder, url: "deal-order" },
    { sortOrder: SortOrder.Ascending, url: "ascending" },
    { sortOrder: SortOrder.Descending, url: "descending" },
  ])("records $url for that sort order", ({ sortOrder, url }) => {
    const { result } = renderTally(HAND, { sortOrder });
    reportScore(result.current);

    expect(recordedSortOrder()).toBe(url);
  });

  // The tables can still be loading when the discard completes, so the score can arrive after a re-sort; the order shown at completion is what is recorded.
  it("keeps the sort order from completion, not a later change made before the score arrives", () => {
    const harness = renderTallyWithMutableCards(
      handOf(HAND, false),
      SortOrder.DealOrder,
    );
    resortTo(harness, SortOrder.DealOrder);
    resortThenReport(harness, SortOrder.Ascending);

    expect(recordedSortOrder()).toBe("deal-order");
  });

  // A hand that arrives already discarded is complete from mount and still captured; TrainerSortOrderRecord.test.tsx pins the timing.
  it("captures the sort order for a hand that is already complete on mount", () => {
    const { result } = renderTally(HAND, {
      discarded: true,
      sortOrder: SortOrder.Ascending,
    });
    reportScore(result.current);

    expect(recordedSortOrder()).toBe("ascending");
  });

  // Later re-reports are absorbed by recordDiscardDecision, so the order offered on them must never be mistaken for the completion's.
  it("keeps the completion sort order across a later re-sort and re-report", () => {
    const harness = renderTallyWithMutableCards(
      handOf(HAND, true),
      SortOrder.Descending,
    );
    reportScore(harness.result.current);
    resortThenReport(harness, SortOrder.Ascending);

    expect(recordedSortOrder()).toBe("descending");
  });

  // A hand alone is not a discard: a different discard of the same cards is a fresh completion. So is re-picking a withdrawn discard, which records the order shown then.
  it.each([
    {
      completedAgain: otherDiscardOfHand,
      name: "a different discard of the same hand",
      sortOrder: SortOrder.DealOrder,
      wanted: "deal-order",
    },
    {
      completedAgain: () => handOf(HAND, true),
      name: "the same discard, redone after a re-sort",
      sortOrder: SortOrder.Ascending,
      wanted: "ascending",
    },
  ])(
    "records the order of the completion that scores, not an earlier withdrawn one, for $name",
    ({ completedAgain, sortOrder, wanted }) => {
      const harness = completeWithoutScoringUnderDescending();
      resortTo(harness, sortOrder);
      showBoard(harness, handOf(HAND, false), sortOrder);
      scoreBoard(harness, completedAgain(), sortOrder);

      expect(recordedSortOrder()).toBe(wanted);
    },
  );

  // The same cards, role and discard can occur twice in one session; the second occurrence must not inherit the first's capture.
  it.each([
    { name: "an interactively dealt first hand", wasDeepLinked: false },
    {
      name: "a deep-linked first hand, which is never opened",
      wasDeepLinked: true,
    },
  ])(
    "keeps the sort order for the occurrence that actually scores, not an earlier abandoned occurrence of the identical hand and discard, for $name",
    ({ wasDeepLinked }) => {
      const harness = completeWithoutScoringUnderDescending(wasDeepLinked);
      replaceAndCompleteUnderAscending(harness);
      reportScore(harness.result.current);

      expect(recordedSortOrder()).toBe("ascending");
    },
  );

  // Across occurrences the outgoing capture must not survive a restore. Within one, a withdrawn and redone completion renders nothing incomplete in between, so only treating the restore as an arrival records the order it shows.
  it.each([
    {
      completeAgainUnderAscending: replaceAndCompleteUnderAscending,
      name: "an identical earlier occurrence",
    },
    {
      completeAgainUnderAscending: (harness: TallyHarness) => {
        showBoard(harness, handOf(HAND, false), SortOrder.Descending);
        showBoard(harness, handOf(HAND, false), SortOrder.Ascending);
        showBoard(harness, handOf(HAND, true), SortOrder.Ascending);
      },
      name: "an identical, withdrawn completion of the same occurrence",
    },
  ])(
    "records the order Back restores when it returns to $name",
    ({ completeAgainUnderAscending }) => {
      const harness = completeWithoutScoringUnderDescending();
      completeAgainUnderAscending(harness);
      // One update with the board, as Trainer's popstate handler batches them.
      act(() => {
        noteRestore(harness.result.current, HAND);
        showBoard(harness, handOf(HAND, true), SortOrder.Descending);
      });
      reportScore(harness.result.current);

      expect(recordedSortOrder()).toBe("descending");
    },
  );
});
