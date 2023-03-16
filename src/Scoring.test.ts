import { CARDS, Card, Rank } from "./Card";
import { POINTS_PER_PAIR, pairsPoints } from "./Scoring";
import { describe, expect, it } from "@jest/globals";

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
});
