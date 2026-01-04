import { CARDS, type Card, INDICES_PER_SUIT } from "./Card";
import { type HandPoints, handPoints } from "./handPoints";
import { CARDS_PER_DEALT_HAND } from "./facts";
import { rankCounts } from "./rankCounts";

export const SUITS_PER_DECK = 4;
export const POSSIBLE_STARTER_COUNT =
  INDICES_PER_SUIT * SUITS_PER_DECK - CARDS_PER_DEALT_HAND;

export const expectedHandPoints = (
  keep: readonly Card[],
  discard: readonly Card[],
): HandPoints => {
  const totalPoints: HandPoints = rankCounts([...keep, ...discard])
    .map((count: number, rank: number) => {
      // eslint-disable-next-line security/detect-object-injection
      const points = handPoints([...keep, CARDS[rank] as Card]);
      return {
        fifteens: points.fifteens * (SUITS_PER_DECK - count),
        pairs: points.pairs * (SUITS_PER_DECK - count),
        runs: points.runs * (SUITS_PER_DECK - count),
        total: points.total * (SUITS_PER_DECK - count),
      };
    })
    .reduce(
      (previous, current) => ({
        fifteens: previous.fifteens + current.fifteens,
        pairs: previous.pairs + current.pairs,
        runs: previous.runs + current.runs,
        total: previous.total + current.total,
      }),
      {
        fifteens: 0,
        pairs: 0,
        runs: 0,
        total: 0,
      },
    );

  const scaledTotalPoints: HandPoints = Object.fromEntries(
    Object.entries(totalPoints).map(([key, value]) => [
      key,
      value /
        (INDICES_PER_SUIT * SUITS_PER_DECK - keep.length - discard.length),
    ]),
  ) as unknown as HandPoints;

  return scaledTotalPoints;
};

export interface ExpectedCutAddedPoints {
  readonly fifteens: number;
  readonly pairs: number;
  readonly runs: number;
}

export const expectedCutAddedPoints = (
  keep: readonly Card[],
  discard: readonly Card[],
): ExpectedCutAddedPoints => {
  const basePoints = handPoints(keep);
  const summedPoints = rankCounts([...keep, ...discard])
    .map((count: number, rank: number) => {
      const remaining = SUITS_PER_DECK - count;
      if (remaining <= 0) {
        return {
          fifteens: 0,
          pairs: 0,
          runs: 0,
          weight: 0,
        };
      }
      // eslint-disable-next-line security/detect-object-injection
      const points = handPoints([...keep, CARDS[rank] as Card]);
      return {
        fifteens: (points.fifteens - basePoints.fifteens) * remaining,
        pairs: (points.pairs - basePoints.pairs) * remaining,
        runs: (points.runs - basePoints.runs) * remaining,
        weight: remaining,
      };
    })
    .reduce(
      (previous, current) => ({
        fifteens: previous.fifteens + current.fifteens,
        pairs: previous.pairs + current.pairs,
        runs: previous.runs + current.runs,
        weight: previous.weight + current.weight,
      }),
      {
        fifteens: 0,
        pairs: 0,
        runs: 0,
        weight: 0,
      },
    );

  if (summedPoints.weight === 0) {
    return {
      fifteens: 0,
      pairs: 0,
      runs: 0,
    };
  }

  return {
    fifteens: summedPoints.fifteens / summedPoints.weight,
    pairs: summedPoints.pairs / summedPoints.weight,
    runs: summedPoints.runs / summedPoints.weight,
  };
};
