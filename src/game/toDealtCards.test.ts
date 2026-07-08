import { describe, expect, it } from "@jest/globals";
import { parseHand } from "./Card";
import { toDealtCards } from "./toDealtCards";

describe("toDealtCards", () => {
  it("assigns dealOrder from card order and keeps every card when discards is null", () => {
    const dealtCards = toDealtCards(parseHand("AH,2H,3H"), null);

    expect(dealtCards.map((dealtCard) => dealtCard.dealOrder)).toStrictEqual([
      0, 1, 2,
    ]);
    expect(dealtCards.every((dealtCard) => dealtCard.kept)).toBe(true);
  });

  it("marks only the discarded cards as not kept", () => {
    const dealtCards = toDealtCards(parseHand("AH,2H,3H"), parseHand("2H"));

    expect(dealtCards.map((dealtCard) => dealtCard.kept)).toStrictEqual([
      true,
      false,
      true,
    ]);
  });
});
