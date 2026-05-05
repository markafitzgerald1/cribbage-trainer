import { DECK, type Card, INDICES_PER_SUIT } from "./Card";
import { type HandPoints, handPoints } from "./handPoints";
import { CARDS_PER_DEALT_HAND } from "./facts";

export const SUITS_PER_DECK = 4;
export const POSSIBLE_STARTER_COUNT =
  INDICES_PER_SUIT * SUITS_PER_DECK - CARDS_PER_DEALT_HAND;

export const expectedHandPoints = (
  keep: readonly Card[],
  discard: readonly Card[],
): HandPoints => {
  const deck = DECK.filter(card => ![...keep, ...discard].some(c => c.rank === card.rank && c.suit === card.suit));
  const totalPoints: HandPoints = deck.map(card => {
    const points = handPoints([...keep, card]);
    return {
      fifteens: points.fifteens,
      flushes: points.flushes,
      pairs: points.pairs,
      runs: points.runs,
      total: points.total,
    };
  })
    .reduce(
      (previous, current) => ({
        fifteens: previous.fifteens + current.fifteens,
        flushes: previous.flushes + current.flushes,
        pairs: previous.pairs + current.pairs,
        runs: previous.runs + current.runs,
        total: previous.total + current.total,
      }),
      {
        fifteens: 0,
        flushes: 0,
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
