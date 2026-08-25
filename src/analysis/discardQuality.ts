/*
 * Six decimals sits far below anything the vendored tables can distinguish
 * and far above the residue of summing fifty-odd terms, so rounding here
 * clears floating-point noise without inventing a tolerance of its own.
 */
const LOSS_FRACTION_DIGITS = 6;

const withoutFloatResidue = (points: number): number =>
  Number(points.toFixed(LOSS_FRACTION_DIGITS));

interface KeptCard {
  readonly kept: boolean;
}

export interface ScoredKeepDiscardChoice {
  readonly discard: readonly KeptCard[];
  readonly expectedNetPoints: number;
}

export interface DiscardQuality {
  readonly expectedPointsLoss: number;
  /*
   * Whether the choice gave up nothing at all, so that "played the top
   * choice N% of the time" means exactly that. Two options the model scores
   * equally both count: picking either is optimal play. Anything the model
   * separates does not, however little it displays as — a choice trailing by
   * 0.004 shows the same 8.00 on screen but is not the top choice, and
   * counting it as one would overstate the number it feeds.
   */
  readonly isOptimal: boolean;
}

/*
 * The quality of a completed discard, derived from an already-scored option
 * list: no scoring, no ranking assumption, and no expected-points source of
 * its own. Analytics (#665) and the local statistics of #19/#24 must agree
 * about what a decision cost, so both read this one rule.
 */
export const getDiscardQuality = (
  scoredKeepDiscards: readonly ScoredKeepDiscardChoice[],
): DiscardQuality | null => {
  /*
   * Found by its discard, never by its keep. Not because a discard identifies
   * an option better — completed, the two are a bijection — but because of
   * what each asks of a partial selection. Both are subset tests pointing
   * opposite ways, and across the fifteen candidates a keep test matches 15,
   * then 5, then 1 as cards are selected, where this one matches 0, then 0,
   * then 1. A keep test would therefore hand find the first of those matches
   * at every incomplete state, reporting as the user's own an option nobody
   * chose. Which one that is depends on the caller's ordering, which this
   * function does not assume — see the Math.max below — though the trainer
   * does pass them in net-score order, making it the top-ranked one there.
   * This test needs two specific cards actually not kept, so it matches none
   * and yields the null below.
   */
  const chosen = scoredKeepDiscards.find((scoredKeepDiscard) =>
    scoredKeepDiscard.discard.every((card) => !card.kept),
  );
  if (!chosen) {
    return null;
  }
  // Taken as a maximum rather than as the first element, so a caller's ordering is its own business.
  const bestExpectedNetPoints = Math.max(
    ...scoredKeepDiscards.map(
      (scoredKeepDiscard) => scoredKeepDiscard.expectedNetPoints,
    ),
  );
  // Compared at full precision rather than at the two decimals the trainer displays: the loss is what the choice actually cost against this model, and the flag below has to mean the top choice rather than "within a hundredth of it".
  const expectedPointsLoss = withoutFloatResidue(
    bestExpectedNetPoints - chosen.expectedNetPoints,
  );
  return {
    expectedPointsLoss,
    isOptimal: expectedPointsLoss === 0,
  };
};
