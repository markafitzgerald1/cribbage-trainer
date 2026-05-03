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

export interface CutBreakdown extends Omit<
  ExpectedCutAddedPoints,
  "avg15s" | "avgPairs" | "avgRuns"
> {
  avgCutAdded15s: number;
  avgCutAddedPairs: number;
  avgCutAddedRuns: number;
}

export function toCutBreakdown(cutAdded: ExpectedCutAddedPoints): CutBreakdown {
  return {
    avgCutAdded15s: cutAdded.avg15s,
    avgCutAddedPairs: cutAdded.avgPairs,
    avgCutAddedRuns: cutAdded.avgRuns,
    cutCountsRemaining: cutAdded.cutCountsRemaining,
    fifteensContributions: cutAdded.fifteensContributions,
    pairsContributions: cutAdded.pairsContributions,
    runsContributions: cutAdded.runsContributions,
  };
}

function processCutContributions({
  accumulator,
  basePoints,
  cutCard,
  keep,
  remaining,
}: {
  accumulator: {
    fifteensContributions: CutContribution[];
    pairsContributions: CutContribution[];
    runsContributions: CutContribution[];
    sum15s: number;
    sumPairs: number;
    sumRuns: number;
    sumWeight: number;
  };
  basePoints: ReturnType<typeof handPoints>;
  cutCard: Card;
  keep: readonly Card[];
  remaining: number;
}) {
  const pointsWithCut = handPoints([...keep, cutCard]);
  const fifteensDelta = pointsWithCut.fifteens - basePoints.fifteens;
  const pairsDelta = pointsWithCut.pairs - basePoints.pairs;
  const runsDelta = pointsWithCut.runs - basePoints.runs;

  accumulator.sumWeight += remaining;
  accumulator.sum15s += fifteensDelta * remaining;
  accumulator.sumPairs += pairsDelta * remaining;
  accumulator.sumRuns += runsDelta * remaining;

  if (fifteensDelta > 0) {
    accumulator.fifteensContributions.push({
      count: remaining,
      cutCard,
      points: fifteensDelta,
    });
  }
  if (pairsDelta > 0) {
    accumulator.pairsContributions.push({
      count: remaining,
      cutCard,
      points: pairsDelta,
    });
  }
  if (runsDelta > 0) {
    accumulator.runsContributions.push({
      count: remaining,
      cutCard,
      points: runsDelta,
    });
  }
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
  const countRemaining = rankCounts([...keep, ...discard]).map(
    (count) => SUITS_PER_DECK - count,
  );
  const basePoints = handPoints(keep);

  const accumulator = {
    fifteensContributions: [] as CutContribution[],
    pairsContributions: [] as CutContribution[],
    runsContributions: [] as CutContribution[],
    sum15s: 0,
    sumPairs: 0,
    sumRuns: 0,
    sumWeight: 0,
  };

  for (let cut = 0; cut < INDICES_PER_SUIT; cut += 1) {
    // eslint-disable-next-line security/detect-object-injection
    const remaining = countRemaining[cut] as number;
    if (remaining > 0) {
      // eslint-disable-next-line security/detect-object-injection
      const cutCard = CARDS[cut] as Card;
      processCutContributions({
        accumulator,
        basePoints,
        cutCard,
        keep,
        remaining,
      });
    }
  }

  return {
    avg15s: accumulator.sum15s / accumulator.sumWeight,
    avgPairs: accumulator.sumPairs / accumulator.sumWeight,
    avgRuns: accumulator.sumRuns / accumulator.sumWeight,
    cutCountsRemaining: countRemaining,
    fifteensContributions: accumulator.fifteensContributions,
    pairsContributions: accumulator.pairsContributions,
    runsContributions: accumulator.runsContributions,
  };
};
