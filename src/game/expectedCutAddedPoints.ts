import { CARDS, type Card, INDICES_PER_SUIT } from "./Card";
import { handPoints } from "./handPoints";
import { rankCounts } from "./rankCounts";
import { SUITS_PER_DECK } from "./expectedHandPoints";

export interface ExpectedCutAddedPoints {
  avg15s: number;
  avgPairs: number;
  avgRuns: number;
}

/**
 * Calculate the average cut-added points by category (fifteens, pairs, runs)
 * for a given keep and discard combination.
 *
 * For each possible cut card (weighted by how many remain in the deck),
 * compute the delta in points for each category compared to the base hand.
 */
export const expectedCutAddedPoints = (
  keep: readonly Card[],
  discard: readonly Card[],
): ExpectedCutAddedPoints => {
  // Calculate how many of each rank remain after dealing the 6 cards
  const countRemaining = rankCounts([...keep, ...discard]).map(
    (count) => SUITS_PER_DECK - count,
  );

  // Get base points (hand without any cut)
  const basePoints = handPoints(keep);

  let sumWeight = 0;
  let sum15s = 0;
  let sumPairs = 0;
  let sumRuns = 0;

  // For each possible cut rank
  for (let cut = 0; cut < INDICES_PER_SUIT; cut++) {
    // eslint-disable-next-line security/detect-object-injection
    const remaining = countRemaining[cut] as number;
    if (remaining === 0) continue;

    // Calculate points with this cut added
    // eslint-disable-next-line security/detect-object-injection
    const ptsWithCut = handPoints([...keep, CARDS[cut] as Card]);

    // Add weighted deltas for each category
    sumWeight += remaining;
    sum15s += (ptsWithCut.fifteens - basePoints.fifteens) * remaining;
    sumPairs += (ptsWithCut.pairs - basePoints.pairs) * remaining;
    sumRuns += (ptsWithCut.runs - basePoints.runs) * remaining;
  }

  return {
    avg15s: sum15s / sumWeight,
    avgPairs: sumPairs / sumWeight,
    avgRuns: sumRuns / sumWeight,
  };
};
