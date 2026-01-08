import type { CutContribution } from "../game/expectedCutAddedPoints";
import type { Rank } from "../game/Card";

export interface CutResult {
  readonly cutCount: number;
  readonly cuts: readonly Rank[];
  readonly fifteensPoints: number;
  readonly pairsPoints: number;
  readonly runsPoints: number;
  readonly totalPoints: number;
}

/**
 * Adds rank to pointsMap and updates cutCountMap if rank not already present.
 */
function addSecondaryContribution(
  contribution: CutContribution,
  pointsMap: Map<Rank, number>,
  cutCountMap: Map<Rank, number>,
) {
  const { rank } = contribution.cutCard;
  pointsMap.set(rank, contribution.points);
  if (!cutCountMap.has(rank)) {
    cutCountMap.set(rank, contribution.count);
  }
}

/**
 * Groups cut contributions by their combined point value across all categories,
 * returning one CutResult per unique combination of (15s points, Pairs points, Runs points).
 * Results are sorted by total points descending, then by cut count descending.
 */
/* eslint-disable max-statements */
export function groupCutsByResults(
  fifteensContributions: readonly CutContribution[],
  pairsContributions: readonly CutContribution[],
  runsContributions: readonly CutContribution[],
): CutResult[] {
  // Create maps from cutCard rank to points for each category
  const fifteensMap = new Map<Rank, number>();
  const pairsMap = new Map<Rank, number>();
  const runsMap = new Map<Rank, number>();
  const cutCountMap = new Map<Rank, number>();

  for (const contribution of fifteensContributions) {
    fifteensMap.set(contribution.cutCard.rank, contribution.points);
    cutCountMap.set(
      contribution.cutCard.rank,
      (cutCountMap.get(contribution.cutCard.rank) ?? 0) + contribution.count,
    );
  }

  for (const contribution of pairsContributions) {
    addSecondaryContribution(contribution, pairsMap, cutCountMap);
  }

  for (const contribution of runsContributions) {
    addSecondaryContribution(contribution, runsMap, cutCountMap);
  }

  // Group ranks by their combination of point values
  const resultKey = (rank: Rank) => {
    const fifteens = fifteensMap.get(rank) ?? 0;
    const pairs = pairsMap.get(rank) ?? 0;
    const runs = runsMap.get(rank) ?? 0;
    return `${fifteens},${pairs},${runs}`;
  };

  const groupMap = new Map<string, Rank[]>();
  for (const rank of cutCountMap.keys()) {
    const key = resultKey(rank);
    const group = groupMap.get(key);
    if (group) {
      group.push(rank);
    } else {
      groupMap.set(key, [rank]);
    }
  }

  // Convert groups to CutResult objects
  const results: CutResult[] = [];
  for (const [key, ranks] of groupMap) {
    // Key format is always "${fifteens},${pairs},${runs}" so split produces exactly 3 elements
    const [fifteensString, pairsString, runsString] = key.split(",");
    const fifteensPoints = Number(fifteensString);
    const pairsPoints = Number(pairsString);
    const runsPoints = Number(runsString);
    // Sum cut counts for all ranks in this group
    // All ranks in groupMap exist in cutCountMap since groupMap is built from cutCountMap.keys()
    const counts = ranks
      .map((rank) => cutCountMap.get(rank))
      .filter((count): count is number => typeof count === "number");
    const cutCount = counts.reduce((sum, count) => sum + count, 0);
    results.push({
      cutCount,
      cuts: ranks,
      fifteensPoints,
      pairsPoints,
      runsPoints,
      totalPoints: fifteensPoints + pairsPoints + runsPoints,
    });
  }

  // Sort by total points desc, then by cut count desc
  results.sort((first, second) => {
    if (first.totalPoints !== second.totalPoints) {
      return second.totalPoints - first.totalPoints;
    }
    return second.cutCount - first.cutCount;
  });

  return results;
}
/* eslint-enable max-statements */
