import { CARD_RANKS, type Rank } from "../game/Card";
import type { CutContribution } from "../game/expectedCutAddedPoints";

const CARDS_PER_RANK = 4;

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

const DESCENDING_MULTIPLIER = -1;

export interface CutContributions {
  readonly fifteens: readonly CutContribution[];
  readonly pairs: readonly CutContribution[];
  readonly runs: readonly CutContribution[];
}

/**
 * Groups cut contributions by their combined point value across all categories,
 * returning one CutResult per unique combination of (15s points, Pairs points, Runs points).
 * Results are sorted by total points descending, then by cut count descending.
 * Zero-point results are always sorted last.
 */
/* eslint-disable max-statements */
export function groupCutsByResults(
  contributions: CutContributions,
): CutResult[] {
  const {
    fifteens: fifteensContributions,
    pairs: pairsContributions,
    runs: runsContributions,
  } = contributions;
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
  // Include all 13 ranks, not just those with contributions
  for (const rank of CARD_RANKS) {
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
    // Use CARDS_PER_RANK for ranks not in cutCountMap (zero-point cuts)
    const cutCount = ranks.reduce<number>(
      (sum, rank) => sum + (cutCountMap.get(rank) ?? CARDS_PER_RANK),
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

  // Sort by total points descending, then by cut count descending
  // Zero-point results always go last
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

  return results;
}
/* eslint-enable max-statements */
