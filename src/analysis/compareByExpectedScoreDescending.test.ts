import { CARDS, type Card } from "../game/Card";
import { type ScoredKeepDiscard, ZERO_EXPECTED_PLAY_POINTS } from "./analysis";
import {
  ScoredKeepDiscardSortKey,
  compareByExpectedNetScoreThenRankDescending,
  compareByExpectedScoreThenRankDescending,
} from "./compareByExpectedScoreDescending";
import { describe, expect, it } from "@jest/globals";
import { expectedHandPoints } from "../game/expectedHandPoints";
import { handPoints } from "../game/handPoints";

const { ACE, TWO, THREE, FOUR, FIVE, JACK, QUEEN, KING } = CARDS;

const CARDS_PER_RANK = 4;
const NUM_RANKS = 13;
const ALL_FOUR_REMAINING = Array.from<number>({
  length: NUM_RANKS,
}).fill(CARDS_PER_RANK);
const missingExpectedCribPointBreakdown = new Map<string, never>().get(
  "missing",
);

describe("compareByExpectedScoreDescending", () => {
  const createHand = (
    keep: Card[],
    discard: Card[],
  ): ScoredKeepDiscard<Card> => ({
    avgCutAdded15s: 0,
    avgCutAddedFlushes: 0,
    avgCutAddedNobs: 0,
    avgCutAddedPairs: 0,
    avgCutAddedRuns: 0,
    cribStarterPoints: [],
    cutCountsRemaining: ALL_FOUR_REMAINING,
    discard,
    expectedCribPointBreakdown: missingExpectedCribPointBreakdown,
    expectedCribPoints: 0,
    expectedHandPoints: expectedHandPoints(keep, discard).total,
    expectedNetPoints: expectedHandPoints(keep, discard).total,
    expectedPlayPoints: ZERO_EXPECTED_PLAY_POINTS,
    fifteensContributions: [],
    flushesContributions: [],
    handPoints: 0,
    handPointsBreakdown: handPoints(keep),
    keep,
    nobsContributions: [],
    pairsContributions: [],
    runsContributions: [],
    signedExpectedCribPoints: 0,
  });

  const expectHandsInDescendingExpectedScoreOrder = (
    hand1: ScoredKeepDiscard<Card>,
    hand2: ScoredKeepDiscard<Card>,
  ) => {
    expect(
      compareByExpectedNetScoreThenRankDescending(hand1, hand2),
    ).toBeLessThan(0);
    expect(
      compareByExpectedNetScoreThenRankDescending(hand2, hand1),
    ).toBeGreaterThan(0);
  };

  it("unequal valued single kept card hands", () =>
    expectHandsInDescendingExpectedScoreOrder(
      createHand([FIVE], [ACE]),
      createHand([ACE], [FIVE]),
    ));

  it("equal valued equal highest index hands with unequal second cards", () =>
    expectHandsInDescendingExpectedScoreOrder(
      createHand([FIVE, TWO], [ACE]),
      createHand([FIVE, ACE], [TWO]),
    ));

  it("equal valued equal two highest indices hands with unequal third cards", () =>
    expectHandsInDescendingExpectedScoreOrder(
      createHand([KING, KING, THREE], [TWO]),
      createHand([KING, KING, TWO], [THREE]),
    ));

  it("equal valued equal three highest indices hands with unequal fourth cards", () =>
    expectHandsInDescendingExpectedScoreOrder(
      createHand([KING, QUEEN, JACK, FOUR], [ACE]),
      createHand([KING, QUEEN, JACK, ACE], [FOUR]),
    ));

  it("returns 0 for identical expected scores and keeps", () => {
    const hand = createHand([ACE, KING], [THREE, TWO]);

    expect(compareByExpectedNetScoreThenRankDescending(hand, hand)).toBe(0);
  });

  it("sorts by the requested expected score before keep-card tie breaker", () => {
    const hand = {
      ...createHand([ACE, KING], [THREE, TWO]),
      expectedHandPoints: 10,
      expectedNetPoints: 1,
      signedExpectedCribPoints: 1,
    };
    const crib = {
      ...createHand([ACE, QUEEN], [THREE, TWO]),
      expectedHandPoints: 1,
      expectedNetPoints: 1,
      signedExpectedCribPoints: 10,
    };
    const play = {
      ...createHand([ACE, JACK], [THREE, TWO]),
      expectedHandPoints: 1,
      expectedNetPoints: 1,
      expectedPlayPoints: { ...ZERO_EXPECTED_PLAY_POINTS, delta: 10 },
      signedExpectedCribPoints: 1,
    };

    expect(
      compareByExpectedScoreThenRankDescending(
        ScoredKeepDiscardSortKey.ExpectedHandPoints,
      )(hand, crib),
    ).toBeLessThan(0);
    expect(
      compareByExpectedScoreThenRankDescending(
        ScoredKeepDiscardSortKey.ExpectedCribPoints,
      )(hand, crib),
    ).toBeGreaterThan(0);
    expect(
      compareByExpectedScoreThenRankDescending(
        ScoredKeepDiscardSortKey.ExpectedPlayPoints,
      )(hand, play),
    ).toBeGreaterThan(0);
  });

  it("falls back to net score for unexpected sort keys", () => {
    const lowNetHand = {
      ...createHand([ACE, KING], [THREE, TWO]),
      expectedNetPoints: 1,
    };
    const highNetHand = {
      ...createHand([ACE, QUEEN], [THREE, TWO]),
      expectedNetPoints: 10,
    };

    expect(
      compareByExpectedScoreThenRankDescending(
        "Unexpected" as ScoredKeepDiscardSortKey,
      )(lowNetHand, highNetHand),
    ).toBeGreaterThan(0);
  });
});
