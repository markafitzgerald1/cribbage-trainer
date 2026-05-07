import { type Card, DECK } from "../game/Card";
import type { CutContribution } from "../game/expectedCutAddedPoints";

export interface CutResult {
  readonly cutCount: number;
  readonly cuts: readonly Card[];
  readonly fifteensPoints: number;
  readonly pairsPoints: number;
  readonly runsPoints: number;
  readonly flushesPoints: number;
  readonly nobsPoints: number;
  readonly totalPoints: number;
}

const DESCENDING_MULTIPLIER = -1;

export interface CutContributions {
  readonly availableCards: readonly Card[];
  readonly fifteens: readonly CutContribution[];
  readonly pairs: readonly CutContribution[];
  readonly runs: readonly CutContribution[];
  readonly flushes: readonly CutContribution[];
  readonly nobs: readonly CutContribution[];
}

function getCardKey(card: Card): string {
  return `${card.rank}-${card.suit}`;
}

function buildPointsMap(
  contributions: readonly CutContribution[],
): Map<string, number> {
  const pointsByCardKey = new Map<string, number>();
  for (const contribution of contributions) {
    pointsByCardKey.set(getCardKey(contribution.cutCard), contribution.points);
  }
  return pointsByCardKey;
}

interface PointMaps {
  readonly fifteensMap: Map<string, number>;
  readonly pairsMap: Map<string, number>;
  readonly runsMap: Map<string, number>;
  readonly flushesMap: Map<string, number>;
  readonly nobsMap: Map<string, number>;
}

function pointsKey(card: Card, maps: PointMaps): string {
  const key = getCardKey(card);
  return `${maps.fifteensMap.get(key) ?? 0},${maps.pairsMap.get(key) ?? 0},${maps.runsMap.get(key) ?? 0},${maps.flushesMap.get(key) ?? 0},${maps.nobsMap.get(key) ?? 0}`;
}

function groupCardsByPointCombination(
  availableCards: Card[],
  maps: PointMaps,
): Map<string, Card[]> {
  const groupMap = new Map<string, Card[]>();
  for (const card of availableCards) {
    const key = pointsKey(card, maps);
    const group = groupMap.get(key);
    if (group) {
      group.push(card);
    } else {
      groupMap.set(key, [card]);
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
  const { keep, discard, fifteens, pairs, runs, flushes, nobs } = contributions;

  const maps: PointMaps = {
    fifteensMap: buildPointsMap(fifteens),
    flushesMap: buildPointsMap(flushes),
    nobsMap: buildPointsMap(nobs),
    pairsMap: buildPointsMap(pairs),
    runsMap: buildPointsMap(runs),
  };

  const handAndDiscard = [...keep, ...discard];
  const availableCards = DECK.filter(
    (card) =>
      !handAndDiscard.some(
        (existingCard) => existingCard.rank === card.rank && existingCard.suit === card.suit,
      ),
  );

  const groupMap = groupCardsByPointCombination(availableCards, maps);

  const results: CutResult[] = [];
  for (const [key, cards] of groupMap) {
    const [fifteensString, pairsString, runsString, flushesString, nobsString] =
      key.split(",");
    const fifteensPoints = Number(fifteensString);
    const pairsPoints = Number(pairsString);
    const runsPoints = Number(runsString);
    const flushesPoints = Number(flushesString);
    const nobsPoints = Number(nobsString);
    results.push({
      cutCount: cards.length,
      cuts: cards,
      fifteensPoints,
      flushesPoints,
      nobsPoints,
      pairsPoints,
      runsPoints,
      totalPoints:
        fifteensPoints + pairsPoints + runsPoints + flushesPoints + nobsPoints,
    });
  }

  sortByTotalPointsDescending(results);

  return results;
}
