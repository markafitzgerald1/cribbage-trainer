import { type Card, CARDS as card, parseHand } from "../game/Card";
const { ACE, TWO, THREE, FOUR, FIVE, SIX, EIGHT, TEN, JACK, QUEEN, KING } =
  card;

import {
  type ScoredKeepDiscard,
  allScoredKeepDiscardsByExpectedScoreDescending,
} from "./analysis";
import { describe, expect, it } from "@jest/globals";

describe("allScoredKeepDiscardsByScoreDescending", () => {
  it("should return nothing for an empty deal", () => {
    expect(allScoredKeepDiscardsByExpectedScoreDescending([])).toStrictEqual(
      [],
    );
  });

  it("should return nothing for a one-card deal", () => {
    expect(allScoredKeepDiscardsByExpectedScoreDescending([ACE])).toStrictEqual(
      [],
    );
  });

  it("two card deal with duplicate cards throws", () => {
    const cards = [ACE, ACE];

    expect(() => allScoredKeepDiscardsByExpectedScoreDescending(cards)).toThrow(
      "Duplicate cards exist",
    );
  });

  const TEN_NUMBER = 10;
  const ROUND_DIGITS = 14;
  const TEN_EXP_ROUND_DIGITS = TEN_NUMBER ** ROUND_DIGITS;
  const round = (expectedHandPoints: number) =>
    Math.round(expectedHandPoints * TEN_EXP_ROUND_DIGITS) /
    TEN_EXP_ROUND_DIGITS;
  const roundExpectedHandPoints = (
    actualScoredKeepDiscards: ScoredKeepDiscard<Card>[],
  ) =>
    actualScoredKeepDiscards.map((scoredKeepDiscard) => ({
      ...scoredKeepDiscard,
      expectedHandPoints: round(scoredKeepDiscard.expectedHandPoints),
    }));

  function expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
    cards: readonly Card[],
  ): void {
    const actualScoredKeepDiscards = roundExpectedHandPoints(
      allScoredKeepDiscardsByExpectedScoreDescending(cards),
    );

    const toComparison = (scored: ScoredKeepDiscard<Card>) => ({
      discard: scored.discard,
      expectedHandPoints: scored.expectedHandPoints,
      handPoints: scored.handPoints,
      keep: scored.keep,
    });
    const actualForComparison = actualScoredKeepDiscards.map(toComparison);

    expect(actualForComparison).toMatchSnapshot();
  }

  it("two card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([ACE, TWO]);
  });

  it("three card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([
      JACK,
      FOUR,
      FIVE,
    ]);
  });

  it("four card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([
      TEN,
      TWO,
      EIGHT,
      FIVE,
    ]);
  });

  it("five card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([
      TEN,
      THREE,
      JACK,
      FIVE,
      FOUR,
    ]);
  });

  it("six card descending rank order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([
      KING,
      QUEEN,
      JACK,
      SIX,
      FIVE,
      FOUR,
    ]);
  });

  it("six card deal with rank ties", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      parseHand("AH,AD,2H,2D,3H,3D"),
    );
  });
});
