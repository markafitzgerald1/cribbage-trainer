import { CARDS_PER_DISCARD, CARDS_PER_KEPT_HAND } from "../game/facts";
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
import {
  type ExpectedPlayPoints,
  type ExpectedPlayPointsTable,
  expectedPlayPoints,
} from "../game/expectedPlayPoints";
import { type HandPoints, handPoints } from "../game/handPoints";
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
  expectedPlayPoints: ExpectedPlayPoints;
  handPoints: number;
  handPointsBreakdown: HandPoints;
  signedExpectedCribPoints: number;
}

const signCribPoints = (cribPoints: number, cribRole: CribRole): number =>
  cribRole === CribRole.Dealer ? cribPoints : -cribPoints;

const EMPTY_PLAY_POINT_BREAKDOWN = {
  fifteens: 0,
  go: 0,
  lastCard: 0,
  pairs: 0,
  runs: 0,
  thirtyOnes: 0,
} as const;

export const ZERO_EXPECTED_PLAY_POINTS: ExpectedPlayPoints = {
  dealer: { pointBreakdown: EMPTY_PLAY_POINT_BREAKDOWN, total: 0 },
  delta: 0,
  pone: { pointBreakdown: EMPTY_PLAY_POINT_BREAKDOWN, total: 0 },
};

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
  tables: {
    readonly crib: ExpectedCribPointsTable;
    readonly play: ExpectedPlayPointsTable;
  },
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
        table: tables.crib,
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
      const playPoints =
        keepDiscard.keep.length === CARDS_PER_KEPT_HAND
          ? expectedPlayPoints({
              keep: keepDiscard.keep,
              role: cribRole,
              table: tables.play,
            })
          : ZERO_EXPECTED_PLAY_POINTS;

      return {
        ...cutBreakdown,
        cribStarterPoints,
        discard: [...keepDiscard.discard].sort(
          (left, right) => right.rank - left.rank,
        ),
        expectedCribPointBreakdown: cribPointBreakdown,
        expectedCribPoints: cribPoints,
        expectedHandPoints: handExpectedPoints,
        expectedNetPoints:
          handExpectedPoints + signedCribPoints + playPoints.delta,
        expectedPlayPoints: playPoints,
        handPoints: handPointsBreakdown.total,
        handPointsBreakdown,
        keep: keepDiscard.keep,
        signedExpectedCribPoints: signedCribPoints,
      };
    })
    .sort(compareByExpectedNetScoreThenRankDescending);
};
