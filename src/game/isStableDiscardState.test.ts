import { describe, expect, it } from "@jest/globals";
import { isStableDiscardState } from "./isStableDiscardState";
import { parseHand } from "./Card";
import { toDealtCards } from "./toDealtCards";

const HAND = "AH,2H,3H,4H,5H,6H";

describe("isStableDiscardState", () => {
  it.each([
    { description: "no cards are discarded", discards: null, expected: true },
    {
      description: "one card is discarded",
      discards: parseHand("AH"),
      expected: false,
    },
    {
      description: "two cards are discarded",
      discards: parseHand("AH,2H"),
      expected: true,
    },
    {
      description: "three cards are discarded",
      discards: parseHand("AH,2H,3H"),
      expected: false,
    },
  ])("returns $expected when $description", ({ discards, expected }) => {
    expect(isStableDiscardState(toDealtCards(parseHand(HAND), discards))).toBe(
      expected,
    );
  });
});
