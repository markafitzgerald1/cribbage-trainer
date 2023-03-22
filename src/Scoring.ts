import { Combination, PowerSet } from "js-combinatorics";
import { CountedCard, RankedCard } from "./Card";
const CARDS_PER_PAIR = 2;
export const HAND_POINTS = {
  DOUBLE_PAIRS_ROYALE: 12,
  FIFTEEN_EIGHT: 8,
  FIFTEEN_FOUR: 4,
  FIFTEEN_SIX: 6,
  FIFTEEN_TWO: 2,
  PAIR: 2,
  PAIRS_ROYALE: 6,
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
