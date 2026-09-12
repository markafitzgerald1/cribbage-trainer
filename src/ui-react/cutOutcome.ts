import { type HandCut, cutForHand } from "../game/cutStarter";
import type { Card } from "../game/Card";
import type { DealtCard } from "../game/DealtCard";

/*
 * Just enough of a scored option to count it and to say what it was worth in
 * expectation. `ScoredKeepDiscard` satisfies this structurally; the fields
 * left out are the ones a single cut has nothing to say about.
 */
export interface CutOutcomeOption {
  readonly discard: readonly DealtCard[];
  readonly expectedHandPoints: number;
  readonly keep: readonly Card[];
  readonly signedExpectedCribPoints: number;
}

export interface CutOutcome {
  // The head of the net-score ordering: the discard the app recommends.
  readonly best: CutOutcomeOption | undefined;
  // The discard actually selected, absent while fewer than two cards are out.
  readonly chosen: CutOutcomeOption | undefined;
  readonly cut: HandCut;
}

/*
 * The cut for a hand, paired with the two options worth counting on it.
 *
 * `chosen` is found by its discard rather than by its keep, for the reason
 * `getDiscardQuality` sets out at length: across the fifteen candidates a keep
 * test matches many options at every incomplete selection and would report one
 * of them as the user's own, where a discard test matches none until two
 * specific cards are actually out.
 */
export const toCutOutcome = (
  dealtCards: readonly DealtCard[],
  scoredKeepDiscardsByNetScore: readonly CutOutcomeOption[],
): CutOutcome => ({
  best: scoredKeepDiscardsByNetScore[0],
  chosen: scoredKeepDiscardsByNetScore.find((option) =>
    option.discard.every((card) => !card.kept),
  ),
  cut: cutForHand(dealtCards),
});
