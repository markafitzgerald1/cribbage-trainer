import { CARDS, type Card } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import type { ScoredKeepDiscard } from "./analysis";
import { compareByExpectedScoreThenRankDescending } from "./compareByExpectedScoreDescending";
import { expectedHandPoints } from "../game/expectedHandPoints";

const { ACE, TWO, THREE, FOUR, FIVE, JACK, QUEEN, KING } = CARDS;

describe("compareByExpectedScoreDescending", () => {
  const createHand = (
    keep: Card[],
    discard: Card[],
  ): ScoredKeepDiscard<Card> => ({
    avgCutAdded15s: 0,
    avgCutAddedPairs: 0,
    avgCutAddedRuns: 0,
    discard,
    expectedHandPoints: expectedHandPoints(keep, discard).total,
    fifteensContributions: [],
    handPoints: 0,
    keep,
    pairsContributions: [],
    runsContributions: [],
  });

  const expectHandsInDescendingExpectedScoreOrder = (
    hand1: ScoredKeepDiscard<Card>,
    hand2: ScoredKeepDiscard<Card>,
  ) => {
    expect(compareByExpectedScoreThenRankDescending(hand1, hand2)).toBeLessThan(
      0,
    );
    expect(
      compareByExpectedScoreThenRankDescending(hand2, hand1),
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

    expect(compareByExpectedScoreThenRankDescending(hand, hand)).toBe(0);
  });
});
