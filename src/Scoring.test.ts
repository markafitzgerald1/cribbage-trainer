import { CARDS, Card, Rank } from "./Card";
import { CARDS_PER_PAIR, POINTS_PER_PAIR, pairsPoints } from "./Scoring";
import { describe, expect, it } from "@jest/globals";
import { combination } from "js-combinatorics";

const expectPairsPoints = (keep: Card[], expectedPoints: number) =>
  expect(pairsPoints(keep)).toBe(expectedPoints);

describe("pairsPoints", () => {
  it("empty hand", () => {
    expectPairsPoints([], 0);
  });

  it("single card hand", () => {
    const SEVEN = CARDS[Rank.SEVEN]!;
    expectPairsPoints([SEVEN], 0);
  });

  it("two equal rank cards", () => {
    const QUEEN = CARDS[Rank.QUEEN]!;
    expect(pairsPoints([QUEEN, QUEEN])).toBe(POINTS_PER_PAIR);
  });

  it("two unequal rank cards", () => {
    expect(pairsPoints([CARDS[Rank.SEVEN]!, CARDS[Rank.EIGHT]!])).toBe(0);
  });

  it("two same count unequal rank cards", () => {
    expect(pairsPoints([CARDS[Rank.TEN]!, CARDS[Rank.JACK]!])).toBe(0);
  });

  it("three unequal rank cards", () => {
    expect(
      pairsPoints([CARDS[Rank.TWO]!, CARDS[Rank.THREE]!, CARDS[Rank.KING]!])
    ).toBe(0);
  });

  it("three cards with two of equal rank", () => {
    expect(
      pairsPoints([CARDS[Rank.FOUR]!, CARDS[Rank.EIGHT]!, CARDS[Rank.FOUR]!])
    ).toBe(POINTS_PER_PAIR);
  });

  it("three cards of equal rank", () => {
    const SIX = CARDS[Rank.SIX]!;
    const keep = [SIX, SIX, SIX];
    expect(pairsPoints(keep)).toBe(
      Number(combination(keep.length, CARDS_PER_PAIR)) * POINTS_PER_PAIR
    );
  });
});
