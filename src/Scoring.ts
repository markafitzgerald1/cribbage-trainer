import { Card } from "./Card";
import { Combination } from "js-combinatorics";

export const CARDS_PER_PAIR = 2;
export const POINTS_PER_PAIR = 2;

export const pairsPoints = (keep: Card[]) =>
  [...new Combination(keep, CARDS_PER_PAIR)].filter(
    ([first, second]) => first!.rankValue === second!.rankValue
  ).length * POINTS_PER_PAIR;
