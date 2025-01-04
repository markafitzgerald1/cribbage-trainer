import { CARDS_PER_DISCARD } from "../game/facts";
import { Card } from "../game/Card";
import { Combination } from "js-combinatorics";
import { expectedHandPoints } from "../game/expectedHandPoints";
import { handPoints } from "../game/handPoints";

export interface ScoredKeepDiscard<T extends Card> {
  keep: readonly T[];
  discard: readonly T[];
  expectedHandPoints: number;
  handPoints: number;
}

export const allScoredKeepDiscardsByExpectedScoreDescending = <T extends Card>(
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
      expectedHandPoints: expectedHandPoints(
        keepDiscard.keep,
        keepDiscard.discard,
      ).total,
      handPoints: handPoints(keepDiscard.keep).total,
      keep: keepDiscard.keep,
    }))
    .sort((discardKeep1, discardKeep2) => {
      if (discardKeep2.expectedHandPoints !== discardKeep1.expectedHandPoints) {
        return (
          discardKeep2.expectedHandPoints - discardKeep1.expectedHandPoints
        );
      }
      if (discardKeep2.handPoints !== discardKeep1.handPoints) {
        return discardKeep2.handPoints - discardKeep1.handPoints;
      }
      if (discardKeep2.keep[0]?.rank !== discardKeep1.keep[0]?.rank) {
        return (
          (discardKeep2.keep[0]?.rank ?? 0) - (discardKeep1.keep[0]?.rank ?? 0)
        );
      }
      return (
        (discardKeep2.keep[1]?.rank ?? 0) - (discardKeep1.keep[1]?.rank ?? 0)
      );
    });
};
