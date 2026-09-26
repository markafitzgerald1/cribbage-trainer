import {
  HAND,
  handOf,
  renderTally,
  renderTallyWithMutableCards,
  reportScore,
} from "./useDiscardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import { SortOrder } from "../ui/SortOrder";
import { readTallyForDisplay } from "../ui/discardTally";

const recordedSortOrder = () => readTallyForDisplay().records[0]?.sortOrder;

// Re-sorts without touching the cards, the shape both a mind-changed sort and a re-render for an unrelated reason share.
const resortTo = (
  harness: ReturnType<typeof renderTallyWithMutableCards>,
  sortOrder: SortOrder,
) => {
  harness.rerender({ dealtCards: handOf(HAND, true), sortOrder });
};

// A re-sort followed by whatever re-report it triggers, standing in for either a mind-changed sort before the score arrives or a Back/Forward-style re-report after it already has.
const resortThenReport = (
  harness: ReturnType<typeof renderTallyWithMutableCards>,
  sortOrder: SortOrder,
) => {
  resortTo(harness, sortOrder);
  reportScore(harness.result.current);
};

/*
 * Every recorded sort order, in the shape urlAnalysisState.ts's sortUrlValue
 * serializes it — the contract #872 asks for, spelled out per value rather
 * than trusted from one case. SortOrder.DealOrder is 0, so a truthiness bug
 * anywhere on this path would silently drop exactly that row's field; the
 * assertion below is a strict equality against a string, not a truthiness
 * check, and would fail loudly if the field were ever missing for it.
 */
describe("recording the sort order a decision was scored under", () => {
  it.each([
    { sortOrder: SortOrder.DealOrder, url: "deal-order" },
    { sortOrder: SortOrder.Ascending, url: "ascending" },
    { sortOrder: SortOrder.Descending, url: "descending" },
  ])("records $url for that sort order", ({ sortOrder, url }) => {
    const { result } = renderTally(HAND, { sortOrder });
    reportScore(result.current);

    expect(recordedSortOrder()).toBe(url);
  });

  /*
   * The race #872 names directly: the tables can still be loading when a
   * discard completes, so the score — and therefore this call — can arrive
   * only after the player has already changed the sort order. What gets
   * recorded must be the order shown at the moment the discard completed,
   * not whatever is on screen when the score finally does arrive.
   */
  it("keeps the sort order from completion, not a later change made before the score arrives", () => {
    const harness = renderTallyWithMutableCards(
      handOf(HAND, false),
      SortOrder.DealOrder,
    );
    // The discard completes while deal order is showing.
    resortTo(harness, SortOrder.DealOrder);
    // The score has not arrived yet, and the player re-sorts in the meantime.
    resortThenReport(harness, SortOrder.Ascending);

    expect(recordedSortOrder()).toBe("deal-order");
  });

  // A hand that arrives already discarded — a reload of its own URL — completes on its very first render, before any effect has run, and still has to be captured.
  it("captures the sort order for a hand that is already complete on mount", () => {
    const { result } = renderTally(HAND, {
      discarded: true,
      sortOrder: SortOrder.Ascending,
    });
    reportScore(result.current);

    expect(recordedSortOrder()).toBe("ascending");
  });

  /*
   * Back, Forward and a re-sort all re-report an already-scored hand (see
   * discardTally hook's own suite). recordDiscardDecision absorbs every
   * later report as a repeat of the first by handKey, but that only leaves
   * the tally correct if the sort order offered on those later reports is
   * never mistaken for the one the decision was actually scored under.
   */
  it("keeps the first-scored sort order across a later re-sort and re-report", () => {
    const harness = renderTallyWithMutableCards(
      handOf(HAND, true),
      SortOrder.Descending,
    );
    reportScore(harness.result.current);
    resortThenReport(harness, SortOrder.Ascending);

    expect(recordedSortOrder()).toBe("descending");
  });
});
