import { CARDS, type Card, INDICES_PER_SUIT } from "./Card";
import { SUITS_PER_DECK } from "./expectedHandPoints";
import { handPoints } from "./handPoints";
import { rankCounts } from "./rankCounts";

export interface CutContribution {
  count: number;
  cutCard: Card;
  points: number;
}

export interface ExpectedCutAddedPoints {
  avg15s: number;
  avgPairs: number;
  avgRuns: number;
  cutCountsRemaining: readonly number[];
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
/* eslint-disable max-statements */
export const expectedCutAddedPoints = (
  keep: readonly Card[],
  discard: readonly Card[],
): ExpectedCutAddedPoints => {
  const countRemaining = rankCounts([...keep, ...discard]).map(
    (count) => SUITS_PER_DECK - count,
  );
  const basePoints = handPoints(keep);

  let sumWeight = 0;
  let sum15s = 0;
  let sumPairs = 0;
  let sumRuns = 0;

  const fifteensContributions: CutContribution[] = [];
  const pairsContributions: CutContribution[] = [];
  const runsContributions: CutContribution[] = [];

  for (let cut = 0; cut < INDICES_PER_SUIT; cut += 1) {
    // eslint-disable-next-line security/detect-object-injection
    const remaining = countRemaining[cut] as number;
    if (remaining === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line security/detect-object-injection
    const cutCard = CARDS[cut] as Card;
    const pointsWithCut = handPoints([...keep, cutCard]);

    const fifteensDelta = pointsWithCut.fifteens - basePoints.fifteens;
    const pairsDelta = pointsWithCut.pairs - basePoints.pairs;
    const runsDelta = pointsWithCut.runs - basePoints.runs;

    sumWeight += remaining;
    sum15s += fifteensDelta * remaining;
    sumPairs += pairsDelta * remaining;
    sumRuns += runsDelta * remaining;

    if (fifteensDelta > 0) {
      fifteensContributions.push({
        count: remaining,
        cutCard,
        points: fifteensDelta,
      });
    }
    if (pairsDelta > 0) {
      pairsContributions.push({
        count: remaining,
        cutCard,
        points: pairsDelta,
      });
    }
    if (runsDelta > 0) {
      runsContributions.push({
        count: remaining,
        cutCard,
        points: runsDelta,
      });
    }
  }

  return {
    avg15s: sum15s / sumWeight,
    avgPairs: sumPairs / sumWeight,
    avgRuns: sumRuns / sumWeight,
    cutCountsRemaining: countRemaining,
    fifteensContributions,
    pairsContributions,
    runsContributions,
  };
};
/* eslint-enable max-statements */
