const EXPECTED_POINTS_FRACTION_DIGITS = 2;

export type ExpectedPointsLossBucket = "0" | "0-0.5" | "0.5-1" | "1-2" | "2+";

const LARGEST_LOSS_BUCKET: ExpectedPointsLossBucket = "2+";
const HALF_POINT = 0.5;
const TWO_POINTS = 2;

// The boundaries #665 names, as exclusive upper bounds: a loss of exactly 0.5, 1, or 2 belongs to the bucket above it.
const lossBucketUpperBounds = [
  ["0-0.5", HALF_POINT],
  ["0.5-1", 1],
  ["1-2", TWO_POINTS],
] as const satisfies readonly (readonly [ExpectedPointsLossBucket, number])[];

const toExpectedPointsLossBucket = (
  expectedPointsLoss: number,
): ExpectedPointsLossBucket =>
  expectedPointsLoss === 0
    ? "0"
    : (lossBucketUpperBounds.find(
        ([, upperBound]) => expectedPointsLoss < upperBound,
      )?.[0] ?? LARGEST_LOSS_BUCKET);

const toDisplayedPoints = (points: number): number =>
  Number(points.toFixed(EXPECTED_POINTS_FRACTION_DIGITS));

interface KeptCard {
  readonly kept: boolean;
}

export interface ScoredKeepDiscardChoice {
  readonly discard: readonly KeptCard[];
  readonly expectedNetPoints: number;
}

export interface DiscardQuality {
  readonly expectedPointsLoss: number;
  readonly expectedPointsLossBucket: ExpectedPointsLossBucket;
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
  // Found by its discard, never by its keep: before two cards are discarded every option's keep is entirely kept, and a keep match would score the top-ranked option as the user's own choice.
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
  /*
   * Both scores are taken to the precision the trainer displays before they
   * are compared, so the reported loss is exactly the difference between the
   * two numbers on screen, and the bucket and optimal flag agree with it.
   * Subtracting first and rounding after does not do that: 8.006 against
   * 8.002 is a loss of 0.00 that way, while the table draws 8.01 and 8.00.
   * The outer rounding only clears the residue of subtracting two decimals.
   */
  const expectedPointsLoss = toDisplayedPoints(
    toDisplayedPoints(bestExpectedNetPoints) -
      toDisplayedPoints(chosen.expectedNetPoints),
  );
  return {
    expectedPointsLoss,
    expectedPointsLossBucket: toExpectedPointsLossBucket(expectedPointsLoss),
    isOptimal: expectedPointsLoss === 0,
  };
};
