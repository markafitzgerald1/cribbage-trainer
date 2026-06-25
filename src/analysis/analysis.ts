import {
  CribRole,
  type ExpectedCribPointBreakdown,
  type ExpectedCribPointsTable,
  type ExpectedCribStarterPoints,
  expectedCribPointBreakdown,
  expectedCribPoints,
  expectedCribPointsByStarterRank,
} from "../game/expectedCribPoints";
import {
  type CutBreakdown,
  expectedCutAddedPoints,
  toCutBreakdown,
} from "../game/expectedCutAddedPoints";
import { type HandPoints, handPoints } from "../game/handPoints";
import { CARDS_PER_DISCARD } from "../game/facts";
import type { Card } from "../game/Card";
import { Combination } from "js-combinatorics";
import { compareByExpectedNetScoreThenRankDescending } from "./compareByExpectedScoreDescending";

export interface ScoredKeepDiscard<T extends Card> extends CutBreakdown {
  keep: readonly T[];
  discard: readonly T[];
  cribStarterPoints: readonly SignedExpectedCribStarterPoints[];
  expectedCribPointBreakdown: ExpectedCribPointBreakdown | undefined;
  expectedCribPoints: number;
  expectedHandPoints: number;
  expectedNetPoints: number;
  handPoints: number;
  handPointsBreakdown: HandPoints;
  signedExpectedCribPoints: number;
}

const signCribPoints = (cribPoints: number, cribRole: CribRole): number =>
  cribRole === CribRole.Dealer ? cribPoints : -cribPoints;

export interface SignedExpectedCribStarterPoints extends ExpectedCribStarterPoints {
  readonly signedExpectedCribPoints: number;
}

const totalExpectedHandPoints = (
  cutAdded: CutBreakdown,
  handPointsBreakdown: HandPoints,
): number =>
  handPointsBreakdown.total +
  cutAdded.avgCutAdded15s +
  cutAdded.avgCutAddedPairs +
  cutAdded.avgCutAddedRuns +
  cutAdded.avgCutAddedFlushes +
  cutAdded.avgCutAddedNobs;

export const allScoredKeepDiscardsByExpectedNetScoreDescending = <
  T extends Card,
>(
  cards: readonly T[],
  cribRole: CribRole,
  table: ExpectedCribPointsTable,
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
      const cutBreakdown = toCutBreakdown(cutAdded);
      const expectedCribOptions = {
        discard: keepDiscard.discard,
        knownCards: cards,
        role: cribRole,
        table,
      };
      const cribPoints = expectedCribPoints(expectedCribOptions);
      const cribPointBreakdown =
        expectedCribPointBreakdown(expectedCribOptions);
      const cribStarterPoints = expectedCribPointsByStarterRank(
        expectedCribOptions,
      ).map((starterPoints) => ({
        ...starterPoints,
        signedExpectedCribPoints: signCribPoints(
          starterPoints.expectedCribPoints,
          cribRole,
        ),
      }));
      const signedCribPoints = signCribPoints(cribPoints, cribRole);
      const handPointsBreakdown = handPoints(keepDiscard.keep);
      const handExpectedPoints = totalExpectedHandPoints(
        cutBreakdown,
        handPointsBreakdown,
      );

      return {
        ...cutBreakdown,
        cribStarterPoints,
        discard: [...keepDiscard.discard].sort(
          (left, right) => right.rank - left.rank,
        ),
        expectedCribPointBreakdown: cribPointBreakdown,
        expectedCribPoints: cribPoints,
        expectedHandPoints: handExpectedPoints,
        expectedNetPoints: handExpectedPoints + signedCribPoints,
        handPoints: handPointsBreakdown.total,
        handPointsBreakdown,
        keep: keepDiscard.keep,
        signedExpectedCribPoints: signedCribPoints,
      };
    })
    .sort(compareByExpectedNetScoreThenRankDescending);
};
