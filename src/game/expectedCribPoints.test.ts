import { type Card, Rank, Suit, createCard, parseHand } from "./Card";
import {
  CribRole,
  type ExpectedCribPointsTable,
  STARTER_RANKS,
  type StarterRank,
  expectedCribPointBreakdown,
  expectedCribPoints,
  expectedCribPointsByStarterRank,
  normalizeDiscardKey,
  randomCribRole,
} from "./expectedCribPoints";
import { describe, expect, it, jest } from "@jest/globals";

const ACE_ACE_UNSUITED = "A_A_Unsuited";
const ACE_TWO_SUITED = "A_2_Suited";
const ACE_TWO_UNSUITED = "A_2_Unsuited";
const ACE_KING_UNSUITED = "A_K_Unsuited";
const KING_STARTER_RANK = "K";
const QUEEN_STARTER_RANK = "Q";
const DEALER_MULTIPLIER = 1;
const PONE_MULTIPLIER = 2;
const KING_PONE_VALUE = 26;
const QUEEN_DEALER_VALUE = 12;
const WEIGHTED_DEALER_TOTAL = 355;
const SIX_KNOWN_STARTERS = 46;
const SUITED_RELATION_WEIGHTED_FIVE = (20 + 10 * 2) / 3;
const SUITED_RELATION_WEIGHTED_TOTAL = 357;
const DEALER_RANDOM_VALUE = 0.49;
const PONE_RANDOM_VALUE = 0.5;
const KNOWN_CARDS = parseHand("AH,AD,AS,AC,2H,3H");
const SUITED_RELATION_KNOWN_CARDS = parseHand("AD,2D,5C,7H,8S,9C");
const ACE_KING_DISCARD = parseHand("AH,KS");
const ACE_TWO_SUITED_DISCARD = parseHand("AD,2D");
const ACE_ACE_UNSUITED_DISCARD = parseHand("AD,AH");

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

const createStatistic = (mu: number) => ({
  mu,
  // eslint-disable-next-line id-length
  n: 0,
  points: {
    fifteens: { mu: mu + 0.1, se: 0 },
    flushes: { mu: mu + 0.4, se: 0 },
    nobs: { mu: mu + 0.5, se: 0 },
    pairs: { mu: mu + 0.2, se: 0 },
    runs: { mu: mu + 0.3, se: 0 },
    total: { mu: mu + 999, se: 0 },
  },
  se: 0,
});

const createStatisticStarterBuckets = () =>
  Object.fromEntries(
    STARTER_RANKS.map((starterRank, index) => [
      starterRank,
      createStatistic(index + 1),
    ]),
  );

const statisticStarterBuckets = createStatisticStarterBuckets();
const missingPointBreakdown = new Map<string, never>().get("missing");
const MATCHING_DISCARD_SUIT_FIELD = "matching_discard_suit";
const NON_MATCHING_DISCARD_SUIT_FIELD = "non_matching_discard_suit";
const STARTER_SUIT_RELATION_FIELD = "starter_suit_relation";
const createIncompleteStatisticStarterBuckets = () =>
  Object.fromEntries(
    STARTER_RANKS.map((starterRank, index) => [
      starterRank,
      {
        mu: index + 1,
        points: {
          fifteens: { mu: index + 1.1, se: 0 },
          flushes: { mu: index + 1.4, se: 0 },
          pairs: { mu: index + 1.2, se: 0 },
          runs: { mu: index + 1.3, se: 0 },
          total: { mu: index + 1, se: 0 },
        },
        se: 0,
      },
    ]),
  );

const v2Table = {
  [ACE_ACE_UNSUITED]: {
    Dealer: {
      ...statisticStarterBuckets,
      "5": {
        ...createStatistic(55),
        [STARTER_SUIT_RELATION_FIELD]: {
          [MATCHING_DISCARD_SUIT_FIELD]: createStatistic(1000),
          [NON_MATCHING_DISCARD_SUIT_FIELD]: createStatistic(2000),
        },
      },
    },
    Pone: statisticStarterBuckets,
  },
  [ACE_KING_UNSUITED]: {
    Dealer: statisticStarterBuckets,
    Pone: statisticStarterBuckets,
  },
  [ACE_TWO_SUITED]: {
    Dealer: {
      ...statisticStarterBuckets,
      "5": {
        ...createStatistic(50),
        [STARTER_SUIT_RELATION_FIELD]: {
          [MATCHING_DISCARD_SUIT_FIELD]: createStatistic(20),
          [NON_MATCHING_DISCARD_SUIT_FIELD]: createStatistic(10),
        },
      },
    },
    Pone: statisticStarterBuckets,
  },
  [ACE_TWO_UNSUITED]: {
    Dealer: statisticStarterBuckets,
    Pone: statisticStarterBuckets,
  },
} as unknown as ExpectedCribPointsTable;
const incompleteV2Table = {
  [ACE_KING_UNSUITED]: {
    Dealer: createIncompleteStatisticStarterBuckets(),
    Pone: createIncompleteStatisticStarterBuckets(),
  },
} as unknown as ExpectedCribPointsTable;

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

const cribStarterFivePoints = (discard: readonly Card[]) =>
  expectedCribPointsByStarterRank(
    expectedCribOptions({
      discard,
      knownCards: SUITED_RELATION_KNOWN_CARDS,
      table: v2Table,
    }),
  ).find((points) => points.starterRank === "5");

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

  it("returns no point breakdown for old numeric buckets", () => {
    const starterPoints = expectedCribPointsByStarterRank(
      expectedCribOptions(),
    );

    expect(expectedCribPointBreakdown(expectedCribOptions())).toBeUndefined();
    expect(starterPoints).toContainEqual(
      expect.objectContaining({
        pointBreakdown: missingPointBreakdown,
        starterRank: KING_STARTER_RANK,
        starterSuitRelationPoints: [],
      }),
    );
  });

  it("uses root mu instead of points total for v2 scoring", () => {
    expect(
      expectedCribPoints(
        expectedCribOptions({
          discard: ACE_TWO_SUITED_DISCARD,
          starterRank: Rank.FIVE,
          table: v2Table,
        }),
      ),
    ).toBe(50);
  });

  it("weights v2 point types from six known cards", () => {
    const breakdown = expectedCribPointBreakdown(
      expectedCribOptions({
        table: v2Table,
      }),
    );

    expect(breakdown?.fifteens).toBeCloseTo(
      WEIGHTED_DEALER_TOTAL / SIX_KNOWN_STARTERS + 0.1,
    );
    expect(breakdown?.flushes).toBeCloseTo(
      WEIGHTED_DEALER_TOTAL / SIX_KNOWN_STARTERS + 0.4,
    );
    expect(breakdown?.nobs).toBeCloseTo(
      WEIGHTED_DEALER_TOTAL / SIX_KNOWN_STARTERS + 0.5,
    );
    expect(breakdown?.pairs).toBeCloseTo(
      WEIGHTED_DEALER_TOTAL / SIX_KNOWN_STARTERS + 0.2,
    );
    expect(breakdown?.runs).toBeCloseTo(
      WEIGHTED_DEALER_TOTAL / SIX_KNOWN_STARTERS + 0.3,
    );
  });

  it("returns no point breakdown when a v2 point category is missing", () => {
    expect(
      expectedCribPointBreakdown(
        expectedCribOptions({
          table: incompleteV2Table,
        }),
      ),
    ).toBeUndefined();
  });

  it("returns crib expected value by starter rank with remaining counts", () => {
    expect(
      expectedCribPointsByStarterRank(expectedCribOptions()),
    ).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          expectedCribPoints: 1,
          remainingStarterCount: 0,
          starterRank: "A",
        }),
        expect.objectContaining({
          expectedCribPoints: KING_PONE_VALUE / PONE_MULTIPLIER,
          remainingStarterCount: 4,
          starterRank: KING_STARTER_RANK,
        }),
      ]),
    );
  });

  it("returns suited matching and non-matching starter relation rows", () => {
    const starterPoints = cribStarterFivePoints(ACE_TWO_SUITED_DISCARD);

    expect(starterPoints?.starterSuitRelationPoints).toStrictEqual([
      expect.objectContaining({
        expectedCribPoints: 20,
        relation: "matching_discard_suit",
        remainingStarterCount: 1,
        suits: [Suit.DIAMONDS],
      }),
      expect.objectContaining({
        expectedCribPoints: 10,
        relation: "non_matching_discard_suit",
        remainingStarterCount: 2,
        suits: [Suit.HEARTS, Suit.SPADES],
      }),
    ]);
  });

  it("weights suited starter rank EV from available relation suits", () => {
    const starterPoints = cribStarterFivePoints(ACE_TWO_SUITED_DISCARD);

    expect(starterPoints?.expectedCribPoints).toBeCloseTo(
      SUITED_RELATION_WEIGHTED_FIVE,
    );
    expect(
      expectedCribPoints(
        expectedCribOptions({
          discard: ACE_TWO_SUITED_DISCARD,
          knownCards: SUITED_RELATION_KNOWN_CARDS,
          table: v2Table,
        }),
      ),
    ).toBeCloseTo(SUITED_RELATION_WEIGHTED_TOTAL / SIX_KNOWN_STARTERS);
  });

  it("suppresses starter relation rows for same-rank pairs", () => {
    const starterPoints = cribStarterFivePoints(ACE_ACE_UNSUITED_DISCARD);

    expect(starterPoints?.starterSuitRelationPoints).toStrictEqual([]);
  });

  it("returns no point breakdown when relation points are missing a category", () => {
    const customTable = {
      ...v2Table,
      [ACE_TWO_SUITED]: {
        ...v2Table[ACE_TWO_SUITED],
        Dealer: {
          ...v2Table[ACE_TWO_SUITED].Dealer,
          "5": {
            ...createStatistic(50),
            [STARTER_SUIT_RELATION_FIELD]: {
              [MATCHING_DISCARD_SUIT_FIELD]: {
                mu: 20,
                // eslint-disable-next-line id-length
                n: 0,
                se: 0,
              },
              [NON_MATCHING_DISCARD_SUIT_FIELD]: createStatistic(10),
            },
          },
        },
      },
    } as unknown as ExpectedCribPointsTable;

    const starterPoints = expectedCribPointsByStarterRank(
      expectedCribOptions({
        discard: ACE_TWO_SUITED_DISCARD,
        knownCards: SUITED_RELATION_KNOWN_CARDS,
        table: customTable,
      }),
    ).find((points) => points.starterRank === "5");

    expect(starterPoints?.pointBreakdown).toBeUndefined();
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
