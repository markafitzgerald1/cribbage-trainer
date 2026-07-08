import {
  CARDS,
  CARD_LABELS,
  CARD_RANKS,
  MAXIMUM_CARD_COUNTING_VALUE,
  Suit,
  createCard,
  isSamePhysicalCard,
  parseCard,
  parseHand,
  parseSuit,
  serializeCard,
  serializeHand,
  suitLetter,
} from "./Card";
import { describe, expect, it } from "@jest/globals";

const LOWERCASE_KING_OF_HEARTS = ["k", "h"].join("");
const LOWERCASE_QUEEN_OF_SPADES = ["q", "s"].join("");
const LOWERCASE_TEN_OF_DIAMONDS = "10d";

describe.each(CARD_RANKS)("createCard %p", (rank) => {
  it(`rank is ${rank}`, () => {
    expect(createCard(rank, "♠").rank).toBe(rank);
  });

  const expectedRankLabel = CARD_LABELS[rank]!;

  it(`rankLabel is ${expectedRankLabel}`, () => {
    expect(createCard(rank, "♠").rankLabel).toBe(expectedRankLabel);
  });

  const expectedCount = Math.min(rank + 1, MAXIMUM_CARD_COUNTING_VALUE);

  it(`count is ${expectedCount}`, () => {
    expect(createCard(rank, "♠").count).toBe(expectedCount);
  });
});

describe("cards", () => {
  it("contains all ranks", () => {
    const allRanksFound = CARD_RANKS.every((rank) => Boolean(CARDS[rank]));

    expect(allRanksFound).toBe(true);
  });
});

describe("parseSuit", () => {
  it.each([
    ["c", Suit.CLUBS],
    ["D", Suit.DIAMONDS],
    ["h", Suit.HEARTS],
    ["S", Suit.SPADES],
    ["♣", Suit.CLUBS],
  ])("parses %p as %p", (char, expected) => {
    expect(parseSuit(char)).toBe(expected);
  });

  it("throws on invalid suit", () => {
    expect(() => parseSuit("X")).toThrow("Invalid suit character: X");
  });
});

describe("parseCard", () => {
  it.each([
    ["KH", "K", Suit.HEARTS],
    [LOWERCASE_KING_OF_HEARTS, "K", Suit.HEARTS],
    ["10D", "10", Suit.DIAMONDS],
  ])("parses %p", (cardLabel, expectedRankLabel, expectedSuit) => {
    const card = parseCard(cardLabel);

    expect(card.rankLabel).toBe(expectedRankLabel);
    expect(card.suit).toBe(expectedSuit);
  });

  it("throws on invalid rank", () => {
    expect(() => parseCard("XH")).toThrow("Invalid rank label: X");
  });
});

describe("suitLetter", () => {
  it.each([
    [Suit.CLUBS, "C"],
    [Suit.DIAMONDS, "D"],
    [Suit.HEARTS, "H"],
    [Suit.SPADES, "S"],
  ])("maps %p to %p", (suit, expectedLetter) => {
    expect(suitLetter(suit)).toBe(expectedLetter);
  });
});

describe("serializeCard", () => {
  it("round-trips a parsed card back to its normalized text form", () => {
    expect(serializeCard(parseCard(LOWERCASE_TEN_OF_DIAMONDS))).toBe("10D");
  });
});

describe("serializeHand", () => {
  it("round-trips a parsed hand back to its normalized text form", () => {
    expect(
      serializeHand(
        parseHand(
          [
            LOWERCASE_KING_OF_HEARTS,
            LOWERCASE_QUEEN_OF_SPADES,
            LOWERCASE_TEN_OF_DIAMONDS,
          ].join(","),
        ),
      ),
    ).toBe("KH,QS,10D");
  });
});

describe("isSamePhysicalCard", () => {
  it("is true for two cards with equal rank and suit", () => {
    expect(
      isSamePhysicalCard(parseCard("KH"), parseCard(LOWERCASE_KING_OF_HEARTS)),
    ).toBe(true);
  });

  it("is false for two cards with equal rank but different suits", () => {
    expect(isSamePhysicalCard(parseCard("KH"), parseCard("KS"))).toBe(false);
  });
});

describe("parseHand", () => {
  it("parses a comma separated hand", () => {
    const hand = parseHand("AH,2S,3C");

    expect(hand).toHaveLength(3);
    expect(hand[0]!.rankLabel).toBe("A");
    expect(hand[1]!.suit).toBe(Suit.SPADES);
  });

  it("parses lowercase face ranks in comma separated hands", () => {
    const hand = parseHand(
      [
        LOWERCASE_KING_OF_HEARTS,
        LOWERCASE_QUEEN_OF_SPADES,
        LOWERCASE_TEN_OF_DIAMONDS,
      ].join(","),
    );

    expect(hand.map((card) => card.rankLabel)).toStrictEqual(["K", "Q", "10"]);
    expect(hand.map((card) => card.suit)).toStrictEqual([
      Suit.HEARTS,
      Suit.SPADES,
      Suit.DIAMONDS,
    ]);
  });

  it("throws on duplicate physical cards", () => {
    expect(() => parseHand("AH,AH,2H")).toThrow(
      "Duplicate card in hand: AH,AH,2H",
    );
  });
});
