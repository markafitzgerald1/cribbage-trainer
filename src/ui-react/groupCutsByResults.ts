import { CARD_RANKS, type Rank } from "../game/Card";
import type { CutContribution } from "../game/expectedCutAddedPoints";

export interface CutResult {
  readonly cutCount: number;
  readonly cuts: readonly Rank[];
  readonly fifteensPoints: number;
  readonly pairsPoints: number;
  readonly runsPoints: number;
  readonly totalPoints: number;
}

const DESCENDING_MULTIPLIER = -1;

export interface CutContributions {
  readonly cutCountsRemaining: readonly number[];
  readonly fifteens: readonly CutContribution[];
  readonly pairs: readonly CutContribution[];
  readonly runs: readonly CutContribution[];
}

function buildPointsMap(
  contributions: readonly CutContribution[],
): Map<Rank, number> {
  const pointsByRank = new Map<Rank, number>();
  for (const contribution of contributions) {
    pointsByRank.set(contribution.cutCard.rank, contribution.points);
  }
  return pointsByRank;
}

interface PointMaps {
  readonly fifteensMap: Map<Rank, number>;
  readonly pairsMap: Map<Rank, number>;
  readonly runsMap: Map<Rank, number>;
}

function pointsKey(rank: Rank, maps: PointMaps): string {
  return `${maps.fifteensMap.get(rank) ?? 0},${maps.pairsMap.get(rank) ?? 0},${maps.runsMap.get(rank) ?? 0}`;
}

function groupRanksByPointCombination(
  availableRanks: Rank[],
  maps: PointMaps,
): Map<string, Rank[]> {
  const groupMap = new Map<string, Rank[]>();
  for (const rank of availableRanks) {
    const key = pointsKey(rank, maps);
    const group = groupMap.get(key);
    if (group) {
      group.push(rank);
    } else {
      groupMap.set(key, [rank]);
    }
  }
  return groupMap;
}

function sortByTotalPointsDescending(results: CutResult[]): void {
  results.sort((first, second) => {
    const firstIsZero = first.totalPoints === 0;
    const secondIsZero = second.totalPoints === 0;
    if (firstIsZero !== secondIsZero) {
      return firstIsZero ? 1 : DESCENDING_MULTIPLIER;
    }
    if (first.totalPoints !== second.totalPoints) {
      return DESCENDING_MULTIPLIER * (first.totalPoints - second.totalPoints);
    }
    return DESCENDING_MULTIPLIER * (first.cutCount - second.cutCount);
  });
}

export function groupCutsByResults(
  contributions: CutContributions,
): CutResult[] {
  const { cutCountsRemaining, fifteens, pairs, runs } = contributions;

  const maps: PointMaps = {
    fifteensMap: buildPointsMap(fifteens),
    pairsMap: buildPointsMap(pairs),
    runsMap: buildPointsMap(runs),
  };

  const availableRanks = CARD_RANKS.filter(
    // eslint-disable-next-line security/detect-object-injection
    (rank) => (cutCountsRemaining[rank] ?? 0) > 0,
  );

  const groupMap = groupRanksByPointCombination(availableRanks, maps);

  const results: CutResult[] = [];
  for (const [key, ranks] of groupMap) {
    const [fifteensString, pairsString, runsString] = key.split(",");
    const fifteensPoints = Number(fifteensString);
    const pairsPoints = Number(pairsString);
    const runsPoints = Number(runsString);
    const cutCount = ranks.reduce<number>(
      // eslint-disable-next-line security/detect-object-injection
      (sum, rank) => sum + (cutCountsRemaining[rank] as number),
      0,
    );
    results.push({
      cutCount,
      cuts: ranks,
      fifteensPoints,
      pairsPoints,
      runsPoints,
      totalPoints: fifteensPoints + pairsPoints + runsPoints,
    });
  }

  sortByTotalPointsDescending(results);

  return results;
}
