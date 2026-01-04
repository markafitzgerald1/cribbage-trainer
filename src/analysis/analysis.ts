import { CARDS_PER_DISCARD } from "../game/facts";
import type { Card } from "../game/Card";
import { Combination } from "js-combinatorics";
import { compareByExpectedScoreThenRankDescending } from "./compareByExpectedScoreDescending";
import {
  expectedCutAddedPoints,
  expectedHandPoints,
} from "../game/expectedHandPoints";
import { handPoints } from "../game/handPoints";

export interface ScoredKeepDiscard<T extends Card> {
  keep: readonly T[];
  discard: readonly T[];
  expectedHandPoints: number;
  expectedCutAddedFifteens: number;
  expectedCutAddedPairs: number;
  expectedCutAddedRuns: number;
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
    .map((keepDiscard) => {
      const cutAddedPoints = expectedCutAddedPoints(
        keepDiscard.keep,
        keepDiscard.discard,
      );
      return {
        discard: keepDiscard.discard,
        expectedHandPoints: expectedHandPoints(
          keepDiscard.keep,
          keepDiscard.discard,
        ).total,
        expectedCutAddedFifteens: cutAddedPoints.fifteens,
        expectedCutAddedPairs: cutAddedPoints.pairs,
        expectedCutAddedRuns: cutAddedPoints.runs,
        handPoints: handPoints(keepDiscard.keep).total,
        keep: keepDiscard.keep,
      };
    })
    .sort(compareByExpectedScoreThenRankDescending);
};
