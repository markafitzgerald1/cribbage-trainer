/* eslint-disable max-statements, id-length, @typescript-eslint/no-magic-numbers */
import { type Card, DECK } from "./Card";
import { handPoints } from "./handPoints";

export interface CutContribution {
  count: number;
  cutCard: Card;
  points: number;
}

export interface ExpectedCutAddedPoints {
  avg15s: number;
  avgFlushes: number;
  avgNobs: number;
  avgPairs: number;
  avgRuns: number;
  cutCountsRemaining: readonly number[];
  fifteensContributions: CutContribution[];
  flushesContributions: CutContribution[];
  nobsContributions: CutContribution[];
  pairsContributions: CutContribution[];
  runsContributions: CutContribution[];
}

export interface CutBreakdown extends Omit<
  ExpectedCutAddedPoints,
  "avg15s" | "avgFlushes" | "avgNobs" | "avgPairs" | "avgRuns"
> {
  avgCutAdded15s: number;
  avgCutAddedFlushes: number;
  avgCutAddedNobs: number;
  avgCutAddedPairs: number;
  avgCutAddedRuns: number;
}

export function toCutBreakdown(cutAdded: ExpectedCutAddedPoints): CutBreakdown {
  return {
    avgCutAdded15s: cutAdded.avg15s,
    avgCutAddedFlushes: cutAdded.avgFlushes,
    avgCutAddedNobs: cutAdded.avgNobs,
    avgCutAddedPairs: cutAdded.avgPairs,
    avgCutAddedRuns: cutAdded.avgRuns,
    cutCountsRemaining: cutAdded.cutCountsRemaining,
    fifteensContributions: cutAdded.fifteensContributions,
    flushesContributions: cutAdded.flushesContributions,
    nobsContributions: cutAdded.nobsContributions,
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
    flushesContributions: CutContribution[];
    nobsContributions: CutContribution[];
    pairsContributions: CutContribution[];
    runsContributions: CutContribution[];
    sum15s: number;
    sumFlushes: number;
    sumNobs: number;
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
  const flushesDelta = pointsWithCut.flushes - basePoints.flushes;
  // Nobs: 1 point for a Jack in the hand that matches the starter card's suit.
  const nobsDelta = keep.some((card) => card.rankLabel === "J" && card.suit === cutCard.suit) ? 1 : 0;
  const pairsDelta = pointsWithCut.pairs - basePoints.pairs;
  const runsDelta = pointsWithCut.runs - basePoints.runs;

  accumulator.sumWeight += remaining;
  accumulator.sum15s += fifteensDelta * remaining;
  accumulator.sumFlushes += flushesDelta * remaining;
  accumulator.sumNobs += nobsDelta * remaining;
  accumulator.sumPairs += pairsDelta * remaining;
  accumulator.sumRuns += runsDelta * remaining;

  if (fifteensDelta > 0) {
    accumulator.fifteensContributions.push({
      count: remaining,
      cutCard,
      points: fifteensDelta,
    });
  }
  if (flushesDelta > 0) {
    accumulator.flushesContributions.push({
      count: remaining,
      cutCard,
      points: flushesDelta,
    });
  }
  if (nobsDelta > 0) {
    accumulator.nobsContributions.push({
      count: remaining,
      cutCard,
      points: nobsDelta,
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

export const expectedCutAddedPoints = (
  keep: readonly Card[],
  discard: readonly Card[],
): ExpectedCutAddedPoints => {
// CountRemaining is not sufficient for a 52 card deck with suits.
  const deck = DECK.filter(card => ![...keep, ...discard].some(c => c.rank === card.rank && c.suit === card.suit));

  const basePoints = handPoints(keep);

  const accumulator = {
    fifteensContributions: [] as CutContribution[],
    flushesContributions: [] as CutContribution[],
    nobsContributions: [] as CutContribution[],
    pairsContributions: [] as CutContribution[],
    runsContributions: [] as CutContribution[],
    sum15s: 0,
    sumFlushes: 0,
    sumNobs: 0,
    sumPairs: 0,
    sumRuns: 0,
    sumWeight: 0,
  };

  // In a 52 card deck, each remaining card is distinct. But we can group by rank+suit or just iterate the remaining deck.
  // Actually, wait, since we grouped by rank before, the CutContribution array size was 13.
  // The UI assumes cutCountsRemaining is size 13.
  const cutCountsRemaining = Array(13).fill(0);
  for (const card of deck) {
    cutCountsRemaining[card.rank] += 1;
    processCutContributions({
      accumulator,
      basePoints,
      cutCard: card,
      keep,
      remaining: 1,
    });
  }

  return {
    avg15s: accumulator.sum15s / accumulator.sumWeight,
    avgFlushes: accumulator.sumFlushes / accumulator.sumWeight,
    avgNobs: accumulator.sumNobs / accumulator.sumWeight,
    avgPairs: accumulator.sumPairs / accumulator.sumWeight,
    avgRuns: accumulator.sumRuns / accumulator.sumWeight,
    cutCountsRemaining,
    fifteensContributions: accumulator.fifteensContributions,
    flushesContributions: accumulator.flushesContributions,
    nobsContributions: accumulator.nobsContributions,
    pairsContributions: accumulator.pairsContributions,
    runsContributions: accumulator.runsContributions,
  };
};
