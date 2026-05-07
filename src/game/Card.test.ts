import {
  CARDS,
  CARD_LABELS,
  CARD_RANKS,
  MAXIMUM_CARD_COUNTING_VALUE,
  Suit,
  createCard,
  parseCard,
  parseHand,
  parseSuit,
} from "./Card";
import { describe, expect, it } from "@jest/globals";

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
  it("parses KH", () => {
    const card = parseCard("KH");

    expect(card.rankLabel).toBe("K");
    expect(card.suit).toBe(Suit.HEARTS);
  });

  it("parses 10D", () => {
    const card = parseCard("10D");

    expect(card.rankLabel).toBe("10");
    expect(card.suit).toBe(Suit.DIAMONDS);
  });

  it("throws on invalid rank", () => {
    expect(() => parseCard("XH")).toThrow("Invalid rank label: X");
  });
});

describe("parseHand", () => {
  it("parses a comma separated hand", () => {
    const hand = parseHand("AH,2S,3C");

    expect(hand).toHaveLength(3);
    expect(hand[0]!.rankLabel).toBe("A");
    expect(hand[1]!.suit).toBe(Suit.SPADES);
  });
});
