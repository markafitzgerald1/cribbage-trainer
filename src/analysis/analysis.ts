import {
  type CutContribution,
  expectedCutAddedPoints,
} from "../game/expectedCutAddedPoints";
import { CARDS_PER_DISCARD } from "../game/facts";
import type { Card } from "../game/Card";
import { Combination } from "js-combinatorics";
import { compareByExpectedScoreThenRankDescending } from "./compareByExpectedScoreDescending";
import { expectedHandPoints } from "../game/expectedHandPoints";
import { handPoints } from "../game/handPoints";

export interface ScoredKeepDiscard<T extends Card> {
  keep: readonly T[];
  discard: readonly T[];
  expectedHandPoints: number;
  handPoints: number;
  /* jscpd:ignore-start */
  avgCutAdded15s: number;
  avgCutAddedPairs: number;
  avgCutAddedRuns: number;
  fifteensContributions: CutContribution[];
  pairsContributions: CutContribution[];
  runsContributions: CutContribution[];
  /* jscpd:ignore-end */
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
      const cutAdded = expectedCutAddedPoints(
        keepDiscard.keep,
        keepDiscard.discard,
      );
      return {
        avgCutAdded15s: cutAdded.avg15s,
        avgCutAddedPairs: cutAdded.avgPairs,
        avgCutAddedRuns: cutAdded.avgRuns,
        discard: keepDiscard.discard,
        expectedHandPoints: expectedHandPoints(
          keepDiscard.keep,
          keepDiscard.discard,
        ).total,
        fifteensContributions: cutAdded.fifteensContributions,
        handPoints: handPoints(keepDiscard.keep).total,
        keep: keepDiscard.keep,
        pairsContributions: cutAdded.pairsContributions,
        runsContributions: cutAdded.runsContributions,
      };
    })
    .sort(compareByExpectedScoreThenRankDescending);
};
