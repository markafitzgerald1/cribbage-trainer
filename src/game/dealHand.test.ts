import { describe, expect, it } from "@jest/globals";
import { CARDS_PER_DEALT_HAND } from "./facts";
import { dealHand } from "./dealHand";
import seedrandom from "seedrandom";

describe("dealHand", () => {
  const mathRandom = Math.random;

  it(`returns ${CARDS_PER_DEALT_HAND} cards`, () => {
    expect(dealHand(mathRandom)).toHaveLength(CARDS_PER_DEALT_HAND);
  });

  it("returns different cards on sequential uses of the same random number generator", () => {
    expect(dealHand(mathRandom)).not.toStrictEqual(dealHand(mathRandom));
  });

  it("returns the same cards on uses of equal random number generators", () => {
    const seed = "my fixed seed value";
    expect(dealHand(seedrandom(seed))).toStrictEqual(
      dealHand(seedrandom(seed)),
    );
  });

  it("cards have unique deal orders", () => {
    const dealOrders = dealHand(mathRandom).map((card) => card.dealOrder);
    expect(dealOrders).toHaveLength(new Set(dealOrders).size);
  });

  it("cards have ascending from 0 deal orders", () => {
    const sortedDealOrders = dealHand(mathRandom)
      .map((card) => card.dealOrder)
      .sort((first, second) => first - second);
    expect(sortedDealOrders).toStrictEqual([
      ...Array(CARDS_PER_DEALT_HAND).keys(),
    ]);
  });

  it("return cards with kept set to true", () => {
    expect(dealHand(mathRandom).every((card) => card.kept)).toBe(true);
  });
});
