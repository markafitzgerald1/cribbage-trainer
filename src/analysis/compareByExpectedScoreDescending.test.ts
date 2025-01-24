import { CARDS, Card } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { ScoredKeepDiscard } from "./analysis";
import { compareByExpectedScoreDescending } from "./compareByExpectedScoreDescending";
import { expectedHandPoints } from "../game/expectedHandPoints";

describe("compareByExpectedScoreDescending", () => {
  function expectCompareByExpectedScoreDescending(
    card1: Card,
    card2: Card,
  ): number {
    return compareByExpectedScoreDescending(
      {
        discard: [card2],
        expectedHandPoints: expectedHandPoints([card1], [card2]).total,
        handPoints: 0,
        keep: [card1],
      },
      {
        discard: [card1],
        expectedHandPoints: expectedHandPoints([card2], [card1]).total,
        handPoints: 0,
        keep: [card2],
      },
    );
  }

  it("is negative when the first hand should come before the second hand", () =>
    expect(
      expectCompareByExpectedScoreDescending(CARDS.FIVE, CARDS.ACE),
    ).toBeLessThan(0));

  it("is positive when the first hand should come after the second hand", () =>
    expect(
      expectCompareByExpectedScoreDescending(CARDS.ACE, CARDS.TWO),
    ).toBeGreaterThan(0));

  const createHand = (
    keep: Card[],
    discard: Card[],
  ): ScoredKeepDiscard<Card> => ({
    discard,
    expectedHandPoints: expectedHandPoints(keep, discard).total,
    handPoints: 0,
    keep,
  });

  it("is positive for equal valued equal highest index hands when the first hand should come after the second hand", () => {
    const { FIVE, TWO, ACE } = CARDS;

    expect(
      compareByExpectedScoreDescending(
        createHand([FIVE, ACE], [TWO]),
        createHand([FIVE, TWO], [ACE]),
      ),
    ).toBeGreaterThan(0);
  });

  it("is negative for equal valued equal two highest indexes hands when the first hand should come after the second hand", () => {
    const { KING, THREE, TWO } = CARDS;

    expect(
      compareByExpectedScoreDescending(
        createHand([KING, KING, THREE], [TWO]),
        createHand([KING, KING, TWO], [THREE]),
      ),
    ).toBeLessThan(0);
  });

  it.todo(
    "sorts equal valued equal highest three indices hands by fourth highest index descending",
  );
});
