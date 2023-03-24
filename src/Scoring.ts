import { Combination, PowerSet } from "js-combinatorics";
import { CountedCard, RankedCard } from "./Card";

const CARDS_PER_PAIR = 2;

const HAND_POINTS = {
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

export const pairsPoints = (keep: RankedCard[]) =>
  [...new Combination(keep, CARDS_PER_PAIR)].filter(
    ([first, second]) => first!.rankValue === second!.rankValue
  ).length * HAND_POINTS.PAIR;

const COUNT = {
  FIFTEEN: 15,
} as const;

export const fifteensPoints = (keep: CountedCard[]) =>
  [...new PowerSet(keep)].filter(
    (possibleFifteen) =>
      possibleFifteen
        .map((card) => card.count)
        .reduce((count1, count2) => count1 + count2, 0) === COUNT.FIFTEEN
  ).length * HAND_POINTS.FIFTEEN_TWO;

enum RunLength {
  THREE = 3,
  FOUR = 4,
}

const runLengthPoints = (keep: RankedCard[], runLength: RunLength) =>
  [...new Combination(keep, runLength)]
    .map((combination) => combination.map((card) => card.rankValue))
    .map((combination) =>
      [...combination].sort((rank1, rank2) => rank1 - rank2)
    )
    .filter((combination) =>
      combination
        .slice(1)
        .map((rank, index) => rank - combination[index]!)
        .every((diff) => diff === 1)
    ).length *
  HAND_POINTS.RUN_PER_CARD *
  runLength;

export const runsPoints = (keep: RankedCard[]) =>
  runLengthPoints(keep, RunLength.FOUR) ||
  runLengthPoints(keep, RunLength.THREE);
