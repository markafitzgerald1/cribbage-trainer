import { CARDS, Card } from "./Card";
import { CARDS_PER_PAIR, POINTS_PER_PAIR, pairsPoints } from "./Scoring";
import { describe, expect, it } from "@jest/globals";
import { combination } from "js-combinatorics";

const expectPairsPoints = (keep: Card[], expectedPoints: number) =>
  expect(pairsPoints(keep)).toBe(expectedPoints);

/* jscpd:ignore-start */
const expectNoPairsPoints = (keep: Card[]) => expectPairsPoints(keep, 0);
const expectTwoPairsPoints = (keep: Card[]) =>
  expectPairsPoints(keep, POINTS_PER_PAIR);
/* jscpd:ignore-end */

const { ACE, TWO, THREE, FOUR, SIX, SEVEN, EIGHT, TEN, JACK, QUEEN, KING } =
  CARDS;

describe("pairsPoints", () => {
  it("empty hand", () => {
    expectNoPairsPoints([]);
  });

  it("single card hand", () => {
    expectNoPairsPoints([SEVEN]);
  });

  it("two equal rank cards", () => {
    expectTwoPairsPoints([QUEEN, QUEEN]);
  });

  it("two unequal rank cards", () => {
    expectNoPairsPoints([SEVEN, EIGHT]);
  });

  it("two same count unequal rank cards", () => {
    expectNoPairsPoints([TEN, JACK]);
  });

  it("three unequal rank cards", () => {
    expectNoPairsPoints([TWO, THREE, KING]);
  });

  it("three cards with two of equal rank", () => {
    expectTwoPairsPoints([FOUR, EIGHT, FOUR]);
  });

  it("three cards of equal rank", () => {
    const keep = [SIX, SIX, SIX];
    expect(pairsPoints(keep)).toBe(
      Number(combination(keep.length, CARDS_PER_PAIR)) * POINTS_PER_PAIR
    );
  });

  it("four unequal rank cards", () => {
    expectNoPairsPoints([EIGHT, ACE, JACK, FOUR]);
  });
});
