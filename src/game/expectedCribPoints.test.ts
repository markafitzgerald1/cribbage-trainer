import {
  CribRole,
  type ExpectedCribPointsTable,
  STARTER_RANKS,
  type StarterRank,
  expectedCribPoints,
  expectedCribPointsByStarterRank,
  normalizeDiscardKey,
  randomCribRole,
} from "./expectedCribPoints";
import { Rank, Suit, createCard, parseHand } from "./Card";
import { describe, expect, it, jest } from "@jest/globals";

const ACE_ACE_UNSUITED = "A_A_Unsuited";
const ACE_TWO_SUITED = "A_2_Suited";
const ACE_KING_UNSUITED = "A_K_Unsuited";
const KING_STARTER_RANK = "K";
const QUEEN_STARTER_RANK = "Q";
const DEALER_MULTIPLIER = 1;
const PONE_MULTIPLIER = 2;
const KING_PONE_VALUE = 26;
const QUEEN_DEALER_VALUE = 12;
const WEIGHTED_DEALER_TOTAL = 355;
const SIX_KNOWN_STARTERS = 46;
const DEALER_RANDOM_VALUE = 0.49;
const PONE_RANDOM_VALUE = 0.5;
const KNOWN_CARDS = parseHand("AH,AD,AS,AC,2H,3H");
const ACE_KING_DISCARD = [
  createCard(Rank.ACE, Suit.HEARTS),
  createCard(Rank.KING, Suit.SPADES),
];

const createIndexedStarterBuckets = (
  multiplier: number,
): Record<StarterRank, number> =>
  Object.fromEntries(
    STARTER_RANKS.map((starterRank, index) => [
      starterRank,
      (index + 1) * multiplier,
    ]),
  ) as Record<StarterRank, number>;

const dealerValues = createIndexedStarterBuckets(DEALER_MULTIPLIER);
const poneValues = createIndexedStarterBuckets(PONE_MULTIPLIER);

const table = {
  [ACE_ACE_UNSUITED]: {
    Dealer: dealerValues,
    Pone: poneValues,
  },
  [ACE_KING_UNSUITED]: {
    Dealer: dealerValues,
    Pone: poneValues,
  },
  [ACE_TWO_SUITED]: {
    Dealer: dealerValues,
    Pone: poneValues,
  },
} as ExpectedCribPointsTable;

const expectedCribOptions = (
  overrides: Partial<Parameters<typeof expectedCribPoints>[0]> = {},
) => ({
  discard: ACE_KING_DISCARD,
  knownCards: KNOWN_CARDS,
  role: CribRole.Dealer,
  table,
  ...overrides,
});

describe("expectedCribPoints", () => {
  it("normalizes rank permutations by crib rank order", () => {
    expect(
      normalizeDiscardKey([
        createCard(Rank.KING, Suit.CLUBS),
        createCard(Rank.ACE, Suit.DIAMONDS),
      ]),
    ).toBe("A_K_Unsuited");
  });

  it("distinguishes suited and unsuited different-rank discards", () => {
    expect(
      normalizeDiscardKey([
        createCard(Rank.TWO, Suit.HEARTS),
        createCard(Rank.ACE, Suit.HEARTS),
      ]),
    ).toBe("A_2_Suited");
  });

  it("uses unsuited keys for same-rank discards", () => {
    expect(
      normalizeDiscardKey([
        createCard(Rank.ACE, Suit.CLUBS),
        createCard(Rank.ACE, Suit.SPADES),
      ]),
    ).toBe("A_A_Unsuited");
  });

  it("weights starter ranks from six known cards", () => {
    expect(expectedCribPoints(expectedCribOptions())).toBeCloseTo(
      WEIGHTED_DEALER_TOTAL / SIX_KNOWN_STARTERS,
    );
  });

  it("returns crib expected value by starter rank with remaining counts", () => {
    expect(
      expectedCribPointsByStarterRank(expectedCribOptions()),
    ).toStrictEqual(
      expect.arrayContaining([
        {
          expectedCribPoints: 1,
          remainingStarterCount: 0,
          starterRank: "A",
        },
        {
          expectedCribPoints: KING_PONE_VALUE / PONE_MULTIPLIER,
          remainingStarterCount: 4,
          starterRank: KING_STARTER_RANK,
        },
      ]),
    );
  });

  it("uses the known starter bucket directly", () => {
    expect(
      expectedCribPoints(
        expectedCribOptions({
          role: CribRole.Pone,
          starterRank: Rank.KING,
        }),
      ),
    ).toBe(KING_PONE_VALUE);
  });

  it("uses a starter rank bucket name directly", () => {
    expect(
      expectedCribPoints(
        expectedCribOptions({
          starterRank: QUEEN_STARTER_RANK,
        }),
      ),
    ).toBe(QUEEN_DEALER_VALUE);
  });

  it("throws when the discard table key is missing", () => {
    expect(() =>
      expectedCribPoints(
        expectedCribOptions({
          discard: [
            createCard(Rank.TWO, Suit.HEARTS),
            createCard(Rank.KING, Suit.SPADES),
          ],
        }),
      ),
    ).toThrow("Missing expected crib points for 2_K_Unsuited");
  });

  it("throws when the starter bucket is missing", () => {
    const dealerValuesWithoutKing = Object.fromEntries(
      STARTER_RANKS.filter(
        (starterRank) => starterRank !== KING_STARTER_RANK,
      ).map((starterRank, index) => [starterRank, index + 1]),
    ) as Record<StarterRank, number>;
    const missingStarterTable = {
      [ACE_KING_UNSUITED]: {
        Dealer: dealerValuesWithoutKing,
        Pone: poneValues,
      },
    } as unknown as ExpectedCribPointsTable;

    expect(() =>
      expectedCribPoints(
        expectedCribOptions({
          starterRank: Rank.KING,
          table: missingStarterTable,
        }),
      ),
    ).toThrow("Missing expected crib points for starter K");
  });

  it("throws when normalizing anything other than two discards", () => {
    expect(() =>
      normalizeDiscardKey([createCard(Rank.ACE, Suit.CLUBS)]),
    ).toThrow("Expected exactly two discarded cards");
  });

  it("randomizes dealer and pone from an injected generator", () => {
    expect(randomCribRole(jest.fn(() => DEALER_RANDOM_VALUE))).toBe(
      CribRole.Dealer,
    );
    expect(randomCribRole(jest.fn(() => PONE_RANDOM_VALUE))).toBe(
      CribRole.Pone,
    );
  });
});
