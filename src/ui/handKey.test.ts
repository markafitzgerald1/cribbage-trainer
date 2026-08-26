import { describe, expect, it } from "@jest/globals";
import { parseHandKey, toHandKey } from "./handKey";
import { CribRole } from "../game/expectedCribPoints";
import { parseHand } from "../game/Card";

const SIX_CARDS_HAND = "AH,2H,3H,4H,5H,6H";
const CARDS = parseHand(SIX_CARDS_HAND);

describe("handKey", () => {
  describe("toHandKey", () => {
    it("serializes cards and role with a pipe delimiter", () => {
      expect(toHandKey(CARDS, CribRole.Dealer)).toBe(
        `${SIX_CARDS_HAND}|Dealer`,
      );
      expect(toHandKey(CARDS, CribRole.Pone)).toBe(`${SIX_CARDS_HAND}|Pone`);
    });
  });

  describe("parseHandKey", () => {
    it.each([{ role: CribRole.Dealer }, { role: CribRole.Pone }])(
      "round-trips a valid hand and $role",
      ({ role }) => {
        const key = toHandKey(CARDS, role);
        const parsed = parseHandKey(key);

        expect(parsed).not.toBeNull();
        expect(parsed?.cribRole).toBe(role);
        expect(parsed?.cards).toStrictEqual(CARDS);
        expect(toHandKey(parsed!.cards, parsed!.cribRole)).toBe(key);
      },
    );

    it.each([
      { key: "", name: "an empty string" },
      { key: SIX_CARDS_HAND, name: "missing delimiter" },
      { key: `${SIX_CARDS_HAND}|`, name: "an empty role" },
      { key: `${SIX_CARDS_HAND}|dealer`, name: "lowercase role" },
      { key: `${SIX_CARDS_HAND}|Unknown`, name: "an unrecognized role" },
      { key: "|Dealer", name: "missing cards" },
      { key: "AH,2H,3H,4H,5H|Dealer", name: "fewer than 6 cards" },
      { key: "AH,2H,3H,4H,5H,6H,7H|Dealer", name: "more than 6 cards" },
      { key: "AH,AH,3H,4H,5H,6H|Dealer", name: "duplicate cards" },
      { key: "AH,2H,3H,4H,5H,99Z|Dealer", name: "invalid card format" },
      { key: "not-a-hand|Dealer", name: "corrupt cards" },
    ])("returns null for $name", ({ key }) => {
      expect(parseHandKey(key)).toBeNull();
    });
  });
});
