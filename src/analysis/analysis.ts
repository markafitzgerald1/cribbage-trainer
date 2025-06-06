import { CARDS_PER_DISCARD } from "../game/facts";
import type { Card } from "../game/Card";
import { Combination } from "js-combinatorics";
import { handPoints } from "../game/scoring";

export interface ScoredKeepDiscard<T extends Card> {
  keep: readonly T[];
  discard: readonly T[];
  points: number;
}

export const allScoredKeepDiscardsByScoreDescending = <T extends Card>(
  cards: readonly T[],
): ScoredKeepDiscard<T>[] => {
  if (new Set(cards).size !== cards.length) {
    throw new Error("Duplicate cards exist");
  }
  return [...new Combination(cards, CARDS_PER_DISCARD)]
    .map((discard) => ({
      discard,
      keep: cards.filter((card) => !discard.includes(card)),
    }))
    .map((keepDiscard) => ({
      discard: keepDiscard.discard,
      keep: keepDiscard.keep,
      points: handPoints(keepDiscard.keep).total,
    }))
    .sort((card1, card2) => card2.points - card1.points);
};
