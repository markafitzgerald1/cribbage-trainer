import {
  HAND,
  INITIAL_HAND_ID,
  handOf,
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

// The same six cards as HAND, discarding a different pair (3H,4H rather than AH,2H) — a distinct discard of one hand, not a distinct hand.
const otherDiscardOfHand = () =>
  toDealtCards(parseHand(HAND), parseHand("3H,4H"));

const recordedSortOrder = () => readTallyForDisplay().records[0]?.sortOrder;

type TallyHarness = ReturnType<typeof renderTallyWithMutableCards>;

const showBoard = (
  harness: TallyHarness,
  dealtCards: ReturnType<typeof handOf>,
  sortOrder: SortOrder,
) => {
  harness.rerender({ dealtCards, sortOrder });
};

// The shared opening of the abandonment tests: HAND's AH,2H discard completes under Descending and never scores.
const completeWithoutScoringUnderDescending = (): TallyHarness => {
  const harness = renderTallyWithMutableCards(
    handOf(HAND, false),
    SortOrder.Descending,
  );
  showBoard(harness, handOf(HAND, true), SortOrder.Descending);
  return harness;
};

/*
 * Replaces the board with the identical six cards through Enter Cards. The
 * replacement and the resulting incomplete board are one React update in the
 * real app (Trainer.tsx's applyManualHand calls reportHandReplaced and
 * setDealState from one handler), so one act() reproduces that; two separate
 * updates would let a render re-capture the old completed discard between them.
 */
const replaceWithSameCards = (harness: TallyHarness) => {
  act(() => {
    harness.result.current.reportHandOrigin(handOf(HAND, false), "manual", {
      cribRole: CribRole.Dealer,
      handId: "second-occurrence",
    });
    showBoard(harness, handOf(HAND, false), SortOrder.Descending);
  });
};

const scoreBoard = (
  harness: TallyHarness,
  dealtCards: ReturnType<typeof handOf>,
  sortOrder: SortOrder,
) => {
  showBoard(harness, dealtCards, sortOrder);
  reportScore(harness.result.current);
};

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

  /*
   * A hand alone is not a discard: completing one discard, abandoning it
   * before it ever scores, then completing a different discard of the same
   * six cards under a different sort order are two completions, and the
   * second one's capture must not find the first one's key already taken.
   * Reproduces the gap an earlier version of this hook had, where the
   * completion map was keyed by hand alone.
   */
  it("keeps the sort order for the discard that actually scores, not an earlier abandoned one", () => {
    // Discard A (AH,2H) completes under Descending, then is abandoned before it scores.
    const harness = completeWithoutScoringUnderDescending();
    showBoard(harness, handOf(HAND, false), SortOrder.Descending);
    // Discard B (3H,4H) completes under a different sort order, and it is the one that scores.
    scoreBoard(harness, otherDiscardOfHand(), SortOrder.DealOrder);

    expect(recordedSortOrder()).toBe("deal-order");
  });

  /*
   * A discard's key names the hand and the discard, but not which occurrence
   * of the hand this is — and the same six cards, role and discard can occur
   * twice in one session: a discard completes while the tables are still
   * loading, the player replaces the board through Enter Cards with the
   * identical six cards, and completes the identical pair again under a
   * different sort order. Without clearing the first occurrence's capture
   * when it is left, the second occurrence's completion would find the
   * first's key already taken and inherit its sort order.
   */
  it("keeps the sort order for the occurrence that actually scores, not an earlier abandoned occurrence of the identical hand and discard", () => {
    // First occurrence: the discard completes under Descending, but is abandoned before its score arrives.
    const harness = completeWithoutScoringUnderDescending();
    replaceWithSameCards(harness);
    // The player changes the sort order, then completes the identical discard again — this is the occurrence that scores.
    scoreBoard(harness, handOf(HAND, true), SortOrder.Ascending);

    expect(recordedSortOrder()).toBe("ascending");
  });

  /*
   * History can also move between occurrences of the identical hand: after
   * the second occurrence completes (not yet scored), Back restores the
   * first, whose URL carries the sort order it was decided under. The
   * outgoing occurrence's capture must not survive into the restored one.
   */
  it("keeps the restored occurrence's own sort order when Back returns to an identical earlier hand", () => {
    const harness = completeWithoutScoringUnderDescending();
    replaceWithSameCards(harness);
    showBoard(harness, handOf(HAND, true), SortOrder.Ascending);
    const firstOccurrence = {
      cribRole: CribRole.Dealer,
      handId: INITIAL_HAND_ID,
    };
    // Restored in one update with its board, as Trainer's popstate handler batches them.
    act(() => {
      harness.result.current.reportHandRestored(handOf(HAND), firstOccurrence);
      showBoard(harness, handOf(HAND, true), SortOrder.Descending);
    });
    reportScore(harness.result.current);

    expect(recordedSortOrder()).toBe("descending");
  });
});
