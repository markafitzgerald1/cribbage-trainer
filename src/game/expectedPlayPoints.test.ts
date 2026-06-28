import { CARDS, Rank, Suit, createCard } from "./Card";
import {
  type ExpectedPlayPointType,
  type ExpectedPlayPointsTable,
  expectedPlayPoints,
  normalizePlayHandKey,
} from "./expectedPlayPoints";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "./expectedCribPoints";

const pointBuckets = Object.fromEntries([
  ["fifteen", { mu: 0.1 }],
  ["go", { mu: 0.2 }],
  ["last_card", { mu: 0.3 }],
  ["pair", { mu: 0.4 }],
  ["run", { mu: 0.5 }],
  ["thirty_one", { mu: 0.6 }],
]) as Readonly<Record<ExpectedPlayPointType, { readonly mu: number }>>;

const playerBucket = (mu: number) => ({
  mu,
  points: {
    ...pointBuckets,
    fifteen: { mu: Number((pointBuckets.fifteen.mu + mu - 2.1).toFixed(10)) },
  },
});

const table = {
  A_5_T_K: {
    Dealer: {
      mu: 1.5,
      players: {
        Dealer: playerBucket(3.6),
        Pone: playerBucket(2.1),
      },
    },
    Pone: {
      mu: -0.75,
      players: {
        Dealer: playerBucket(2.85),
        Pone: playerBucket(2.1),
      },
    },
  },
} as ExpectedPlayPointsTable;

const keep = [CARDS.KING, CARDS.FIVE, CARDS.ACE, CARDS.TEN];

const withDealerBucket = (
  dealer: Partial<(typeof table)["A_5_T_K"]["Dealer"]>,
): ExpectedPlayPointsTable => ({
  ...table,
  A_5_T_K: {
    ...table.A_5_T_K,
    Dealer: { ...table.A_5_T_K.Dealer, ...dealer },
  },
});

const getDealerPoints = (invalidTable: ExpectedPlayPointsTable) =>
  expectedPlayPoints({
    keep,
    role: CribRole.Dealer,
    table: invalidTable,
  });

describe("expectedPlayPoints", () => {
  it("normalizes four kept ranks without suit dependence", () => {
    expect(normalizePlayHandKey(keep)).toBe("A_5_T_K");
    expect(
      normalizePlayHandKey([
        createCard(Rank.KING, Suit.HEARTS),
        createCard(Rank.TEN, Suit.SPADES),
        createCard(Rank.FIVE, Suit.DIAMONDS),
        createCard(Rank.ACE, Suit.CLUBS),
      ]),
    ).toBe("A_5_T_K");
  });

  it("requires exactly four kept cards", () => {
    expect(() => normalizePlayHandKey(keep.slice(1))).toThrow(
      "Expected exactly four kept cards",
    );
  });

  it.each([
    { dealerTotal: 3.6, delta: 1.5, role: CribRole.Dealer },
    { dealerTotal: 2.85, delta: -0.75, role: CribRole.Pone },
  ])(
    "returns $role seat totals and point types",
    ({ dealerTotal, delta, role }) => {
      const result = expectedPlayPoints({ keep, role, table });

      expect(result.delta).toBe(delta);
      expect(result.dealer.total).toBe(dealerTotal);
      expect(result.pone.total).toBe(2.1);
      expect(result.pone.pointBreakdown).toStrictEqual({
        fifteens: 0.1,
        go: 0.2,
        lastCard: 0.3,
        pairs: 0.4,
        runs: 0.5,
        thirtyOnes: 0.6,
      });
    },
  );

  it("rejects a missing hand bucket", () => {
    expect(() =>
      expectedPlayPoints({
        keep: [CARDS.ACE, CARDS.TWO, CARDS.THREE, CARDS.FOUR],
        role: CribRole.Dealer,
        table,
      }),
    ).toThrow("Missing expected play points for A_2_3_4");
  });

  it("rejects inconsistent point components", () => {
    const invalidTable = withDealerBucket({
      players: {
        ...table.A_5_T_K.Dealer.players,
        Dealer: {
          mu: 99,
          points: pointBuckets,
        },
      },
    });

    expect(() => getDealerPoints(invalidTable)).toThrow(
      "Expected play point breakdown does not sum to total",
    );
  });

  it("rejects a delta inconsistent with player totals", () => {
    expect(() => getDealerPoints(withDealerBucket({ mu: 99 }))).toThrow(
      "Expected play delta does not match player totals",
    );
  });
});
