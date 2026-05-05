/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-non-null-assertion, prefer-destructuring */
import type { Card, CountedCard, RankedCard } from "./Card";
import { Combination, PowerSet } from "js-combinatorics";

const CARDS_PER_PAIR = 2;

export const HAND_POINTS = {
  DOUBLE_PAIRS_ROYALE: 12,
  FIFTEEN_EIGHT: 8,
  FIFTEEN_FOUR: 4,
  FIFTEEN_SIX: 6,
  FIFTEEN_TWO: 2,
  FLUSH: 4,
  FLUSH_WITH_STARTER: 5,
  PAIR: 2,
  PAIRS_ROYALE: 6,
  RUN_PER_CARD: 1,
  TWO_PAIRS: 4,
} as const;

const pairsPoints = (keep: readonly RankedCard[]) =>
  [...new Combination(keep, CARDS_PER_PAIR)].filter(

    ([first, second]) => first!.rank === second!.rank,
  ).length * HAND_POINTS.PAIR;

const COUNT = {
  FIFTEEN: 15,
} as const;

const fifteensPoints = (keep: readonly CountedCard[]) =>
  [...new PowerSet(keep)].filter(
    (possibleFifteen) =>
      possibleFifteen
        .map((card) => card.count)
        .reduce((count1, count2) => count1 + count2, 0) === COUNT.FIFTEEN,
  ).length * HAND_POINTS.FIFTEEN_TWO;

/* eslint-disable sort-keys */
const RunLength = {
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
} as const;
/* eslint-enable sort-keys */

type RunLength = (typeof RunLength)[keyof typeof RunLength];

const runLengthPoints = (keep: readonly RankedCard[], runLength: RunLength) =>
  [...new Combination(keep, runLength)]
    .map((combination) => combination.map((card) => card.rank))
    .map((combination) =>
      [...combination].sort((rank1, rank2) => rank1 - rank2),
    )
    .filter((combination) =>
      combination
        .slice(1)
        // eslint-disable-next-line security/detect-object-injection
        .map((rank, index) => rank - (combination[index] as number))
        .every((diff) => diff === 1),
    ).length *
  HAND_POINTS.RUN_PER_CARD *
  runLength;

const runsPoints = (keep: readonly RankedCard[]) =>
  runLengthPoints(keep, RunLength.FIVE) ||
  runLengthPoints(keep, RunLength.FOUR) ||
  runLengthPoints(keep, RunLength.THREE);


const flushPoints = (cards: readonly Card[]): number => {
  if (cards.length < 4) {
    return 0;
  }

  if (cards.length === 4) {
    const firstSuit = cards[0]!.suit;
    const isFlush = cards.every(card => card.suit === firstSuit);
    return isFlush ? HAND_POINTS.FLUSH : 0;
  }

  if (cards.length === 5) {
    const hand = cards.slice(0, 4);
    const starter = cards[4];
    const firstSuit = hand[0]!.suit;
    const isHandFlush = hand.every(card => card.suit === firstSuit);
    if (!isHandFlush) {
      return 0;
    }
    return starter!.suit === firstSuit ? HAND_POINTS.FLUSH_WITH_STARTER : HAND_POINTS.FLUSH;
  }

  return 0;
};

export interface HandPoints {
  fifteens: number;
  pairs: number;
  flushes: number;
  runs: number;
  total: number;
}
export const handPoints = (keep: readonly Card[]): HandPoints => {
  const pairs = pairsPoints(keep);
  const fifteens = fifteensPoints(keep);
  const runs = runsPoints(keep);
  const flushes = flushPoints(keep);
  return {
    fifteens,
    flushes,
    pairs,
    runs,
    total: pairs + fifteens + runs + flushes,
  };
};
