const EXPECTED_POINTS_FRACTION_DIGITS = 2;

export type ExpectedPointsLossBucket = "0" | "0-0.5" | "0.5-1" | "1-2" | "2+";

const LARGEST_LOSS_BUCKET: ExpectedPointsLossBucket = "2+";

// The boundaries #665 names, as exclusive upper bounds: a loss of exactly 0.5, 1, or 2 belongs to the bucket above it.
const lossBucketUpperBounds = [
  ["0-0.5", 0.5],
  ["0.5-1", 1],
  ["1-2", 2],
] as const satisfies readonly (readonly [ExpectedPointsLossBucket, number])[];

const toExpectedPointsLossBucket = (
  expectedPointsLoss: number,
): ExpectedPointsLossBucket =>
  expectedPointsLoss === 0
    ? "0"
    : (lossBucketUpperBounds.find(
        ([, upperBound]) => expectedPointsLoss < upperBound,
      )?.[0] ?? LARGEST_LOSS_BUCKET);

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
  // Rounded to the precision the trainer displays before anything is derived from it, so the reported loss, its bucket, and the optimal flag agree with the table the user is looking at.
  const expectedPointsLoss = Number(
    (bestExpectedNetPoints - chosen.expectedNetPoints).toFixed(
      EXPECTED_POINTS_FRACTION_DIGITS,
    ),
  );
  return {
    expectedPointsLoss,
    expectedPointsLossBucket: toExpectedPointsLossBucket(expectedPointsLoss),
    isOptimal: expectedPointsLoss === 0,
  };
};
