import { CARDS, Card } from "./Card";
import { CARDS_PER_PAIR, POINTS_PER_PAIR, pairsPoints } from "./Scoring";
import { describe, expect, it } from "@jest/globals";
import { combination } from "js-combinatorics";

const expectPairsPoints = (keep: Card[], expectedPoints: number) =>
  expect(pairsPoints(keep)).toBe(expectedPoints);

const { ACE, TWO, THREE, FOUR, SIX, SEVEN, EIGHT, TEN, JACK, QUEEN, KING } =
  CARDS;

describe("pairsPoints", () => {
  it("empty hand", () => {
    expectPairsPoints([], 0);
  });

  it("single card hand", () => {
    expectPairsPoints([SEVEN], 0);
  });

  it("two equal rank cards", () => {
    expect(pairsPoints([QUEEN, QUEEN])).toBe(POINTS_PER_PAIR);
  });

  it("two unequal rank cards", () => {
    expect(pairsPoints([SEVEN, EIGHT])).toBe(0);
  });

  it("two same count unequal rank cards", () => {
    expect(pairsPoints([TEN, JACK])).toBe(0);
  });

  it("three unequal rank cards", () => {
    expect(pairsPoints([TWO, THREE, KING])).toBe(0);
  });

  it("three cards with two of equal rank", () => {
    expect(pairsPoints([FOUR, EIGHT, FOUR])).toBe(POINTS_PER_PAIR);
  });

  it("three cards of equal rank", () => {
    const keep = [SIX, SIX, SIX];
    expect(pairsPoints(keep)).toBe(
      Number(combination(keep.length, CARDS_PER_PAIR)) * POINTS_PER_PAIR
    );
  });

  it("four unequal rank cards", () => {
    expect(pairsPoints([EIGHT, ACE, JACK, FOUR])).toBe(0);
  });
});
