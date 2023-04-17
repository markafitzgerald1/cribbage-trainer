import { describe, expect, it } from "@jest/globals";
import { CARDS_PER_DEALT_HAND } from "./facts";
import { INDICES_PER_SUIT } from "./Card";
import { dealHand } from "./dealHand";

describe("dealHand", () => {
  it(`returns ${CARDS_PER_DEALT_HAND} cards`, () => {
    expect(dealHand()).toHaveLength(CARDS_PER_DEALT_HAND);
  });

  it("returns different cards each time", () => {
    expect(dealHand()).not.toStrictEqual(dealHand());
  });

  it("cards have unique deal orders", () => {
    const dealOrders = dealHand().map((card) => card.dealOrder);
    expect(dealOrders).toHaveLength(new Set(dealOrders).size);
  });

  it("cards have ascending from 0 deal orders", () => {
    const sortedDealOrders = dealHand()
      .map((card) => card.dealOrder)
      .sort((first, second) => first - second);
    expect(sortedDealOrders).toStrictEqual([
      ...Array(CARDS_PER_DEALT_HAND).keys(),
    ]);
  });

  it("returns cards with non-negative ranks", () => {
    expect(dealHand().every((card) => card.rankValue >= 0)).toBe(true);
  });

  it(`returns cards with ranks less than ${INDICES_PER_SUIT}`, () => {
    expect(dealHand().every((card) => card.rankValue < INDICES_PER_SUIT)).toBe(
      true
    );
  });

  it("return cards with kept set to true", () => {
    expect(dealHand().every((card) => card.kept)).toBe(true);
  });
});
