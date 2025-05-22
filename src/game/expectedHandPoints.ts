import { CARDS, Card, INDICES_PER_SUIT } from "./Card";
import { HandPoints, handPoints } from "./handPoints";
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
