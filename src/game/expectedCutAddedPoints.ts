import { CARDS, type Card, INDICES_PER_SUIT } from "./Card";
import { handPoints } from "./handPoints";
import { rankCounts } from "./rankCounts";
import { SUITS_PER_DECK } from "./expectedHandPoints";

export interface CutContribution {
  cutCard: Card;
  count: number;
  points: number;
}

export interface ExpectedCutAddedPoints {
  avg15s: number;
  avgPairs: number;
  avgRuns: number;
  fifteensContributions: CutContribution[];
  pairsContributions: CutContribution[];
  runsContributions: CutContribution[];
}

/**
 * Calculate the average cut-added points by category (fifteens, pairs, runs)
 * for a given keep and discard combination.
 *
 * For each possible cut card (weighted by how many remain in the deck),
 * compute the delta in points for each category compared to the base hand.
 * Also returns which cuts contribute to each category and how many.
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

  const fifteensContributions: CutContribution[] = [];
  const pairsContributions: CutContribution[] = [];
  const runsContributions: CutContribution[] = [];

  // For each possible cut rank
  for (let cut = 0; cut < INDICES_PER_SUIT; cut++) {
    // eslint-disable-next-line security/detect-object-injection
    const remaining = countRemaining[cut] as number;
    if (remaining === 0) continue;

    // Calculate points with this cut added
    // eslint-disable-next-line security/detect-object-injection
    const cutCard = CARDS[cut] as Card;
    const ptsWithCut = handPoints([...keep, cutCard]);

    // Calculate deltas for each category
    const fifteensDelta = ptsWithCut.fifteens - basePoints.fifteens;
    const pairsDelta = ptsWithCut.pairs - basePoints.pairs;
    const runsDelta = ptsWithCut.runs - basePoints.runs;

    // Add weighted deltas for each category
    sumWeight += remaining;
    sum15s += fifteensDelta * remaining;
    sumPairs += pairsDelta * remaining;
    sumRuns += runsDelta * remaining;

    // Track which cuts contribute to each category
    if (fifteensDelta > 0) {
      fifteensContributions.push({
        cutCard,
        count: remaining,
        points: fifteensDelta,
      });
    }
    if (pairsDelta > 0) {
      pairsContributions.push({
        cutCard,
        count: remaining,
        points: pairsDelta,
      });
    }
    if (runsDelta > 0) {
      runsContributions.push({
        cutCard,
        count: remaining,
        points: runsDelta,
      });
    }
  }

  return {
    avg15s: sum15s / sumWeight,
    avgPairs: sumPairs / sumWeight,
    avgRuns: sumRuns / sumWeight,
    fifteensContributions,
    pairsContributions,
    runsContributions,
  };
};
