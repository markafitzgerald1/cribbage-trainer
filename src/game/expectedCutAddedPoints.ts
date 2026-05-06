import { type Card, SUITS_PER_DECK } from "./Card";
import { getRemainingDeck } from "./getRemainingDeck";
import { handPoints } from "./handPoints";
import { rankCounts } from "./rankCounts";

export interface CutContribution {
  count: number;
  cutCard: Card;
  points: number;
}

export interface ContributionsBreakdown {
  fifteensContributions: CutContribution[];
  flushesContributions: CutContribution[];
  nobsContributions: CutContribution[];
  pairsContributions: CutContribution[];
  runsContributions: CutContribution[];
}

export interface ExpectedCutAddedPoints extends ContributionsBreakdown {
  avg15s: number;
  avgFlushes: number;
  avgNobs: number;
  avgPairs: number;
  avgRuns: number;
  cutCountsRemaining: readonly number[];
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

function updateContribution({
  contributions,
  delta,
  cutCard,
  remaining,
}: {
  contributions: CutContribution[];
  delta: number;
  cutCard: Card;
  remaining: number;
}) {
  if (delta > 0) {
    contributions.push({
      count: remaining,
      cutCard,
      points: delta,
    });
  }
}

function processCutContributions({
  accumulator,
  basePoints,
  cutCard,
  keep,
  remaining,
}: {
  accumulator: ContributionsBreakdown & {
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
  const pairsDelta = pointsWithCut.pairs - basePoints.pairs;
  const runsDelta = pointsWithCut.runs - basePoints.runs;
  const flushesDelta = pointsWithCut.flushes - basePoints.flushes;
  const nobsDelta = pointsWithCut.nobs - basePoints.nobs;

  accumulator.sumWeight += remaining;
  accumulator.sum15s += fifteensDelta * remaining;
  accumulator.sumPairs += pairsDelta * remaining;
  accumulator.sumRuns += runsDelta * remaining;
  accumulator.sumFlushes += flushesDelta * remaining;
  accumulator.sumNobs += nobsDelta * remaining;

  const categories = [
    { contributions: accumulator.fifteensContributions, delta: fifteensDelta },
    { contributions: accumulator.pairsContributions, delta: pairsDelta },
    { contributions: accumulator.runsContributions, delta: runsDelta },
    { contributions: accumulator.flushesContributions, delta: flushesDelta },
    { contributions: accumulator.nobsContributions, delta: nobsDelta },
  ];

  for (const { contributions, delta } of categories) {
    updateContribution({
      contributions,
      cutCard,
      delta,
      remaining,
    });
  }
}

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

  for (const cutCard of getRemainingDeck([...keep, ...discard])) {
    const remaining = 1;
    processCutContributions({
      accumulator,
      basePoints,
      cutCard,
      keep,
      remaining,
    });
  }

  return {
    avg15s: accumulator.sum15s / accumulator.sumWeight,
    avgFlushes: accumulator.sumFlushes / accumulator.sumWeight,
    avgNobs: accumulator.sumNobs / accumulator.sumWeight,
    avgPairs: accumulator.sumPairs / accumulator.sumWeight,
    avgRuns: accumulator.sumRuns / accumulator.sumWeight,
    cutCountsRemaining: countRemaining,
    fifteensContributions: accumulator.fifteensContributions,
    flushesContributions: accumulator.flushesContributions,
    nobsContributions: accumulator.nobsContributions,
    pairsContributions: accumulator.pairsContributions,
    runsContributions: accumulator.runsContributions,
  };
};
