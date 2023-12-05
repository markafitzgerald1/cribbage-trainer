import { Card, CountedCard, RankedCard } from "./Card";
import { Combination, PowerSet } from "js-combinatorics";

const CARDS_PER_PAIR = 2;

export const HAND_POINTS = {
  DOUBLE_PAIRS_ROYALE: 12,
  FIFTEEN_EIGHT: 8,
  FIFTEEN_FOUR: 4,
  FIFTEEN_SIX: 6,
  FIFTEEN_TWO: 2,
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

enum RunLength {
  THREE = 3,
  FOUR = 4,
}

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
        .map((rank, index) => rank - combination[index]!)
        .every((diff) => diff === 1),
    ).length *
  HAND_POINTS.RUN_PER_CARD *
  runLength;

const runsPoints = (keep: readonly RankedCard[]) =>
  runLengthPoints(keep, RunLength.FOUR) ||
  runLengthPoints(keep, RunLength.THREE);

export interface HandPoints {
  fifteens: number;
  pairs: number;
  runs: number;
  total: number;
}
export const handPoints = (keep: readonly Card[]): HandPoints => {
  const pairs = pairsPoints(keep);
  const fifteens = fifteensPoints(keep);
  const runs = runsPoints(keep);
  return {
    fifteens,
    pairs,
    runs,
    total: pairs + fifteens + runs,
  };
};
