import { type Card, CARDS as card, parseHand } from "../game/Card";
import {
  CribRole,
  type ExpectedCribPointsTable,
  STARTER_RANKS,
  type StarterRank,
} from "../game/expectedCribPoints";
import {
  type ScoredKeepDiscard,
  allScoredKeepDiscardsByExpectedNetScoreDescending,
} from "./analysis";
import { describe, expect, it } from "@jest/globals";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import expectedCribPointsTableData from "../game/expectedCribPointsTable.json";
import expectedPlayPointsTableData from "../game/expectedPlayPointsTable.json";

const expectedCribPointsTable =
  expectedCribPointsTableData as unknown as ExpectedCribPointsTable;
const expectedPlayPointsTable =
  expectedPlayPointsTableData as unknown as ExpectedPlayPointsTable;

const scoreDeal = (
  cards: readonly Card[],
  cribRole: CribRole = CribRole.Dealer,
  table: ExpectedCribPointsTable = expectedCribPointsTable,
) =>
  allScoredKeepDiscardsByExpectedNetScoreDescending(cards, cribRole, {
    crib: table,
    play: expectedPlayPointsTable,
  });

const { ACE, TWO, THREE, FOUR, FIVE, SIX, EIGHT, TEN, JACK, QUEEN, KING } =
  card;

const TEN_NUMBER = 10;
const ROUND_DIGITS = 14;
const TEN_EXP_ROUND_DIGITS = TEN_NUMBER ** ROUND_DIGITS;
const DEALER_CRIB_POINTS = 100;
const PONE_HIGH_CRIB_POINTS = 20;
const LOW_CRIB_POINTS = 2;
const LOW_DEALER_CRIB_POINTS = 1;
const TEST_HAND = "AH,2D,KS";
const ACE_TWO_UNSUITED = "A_2_Unsuited";
const ACE_KING_UNSUITED = "A_K_Unsuited";
const TWO_KING_UNSUITED = "2_K_Unsuited";

const createStarterBuckets = (points: number): Record<StarterRank, number> =>
  Object.fromEntries(
    STARTER_RANKS.map((starterRank) => [starterRank, points]),
  ) as Record<StarterRank, number>;

const createRoleBuckets = (dealer: number, pone: number) => ({
  Dealer: createStarterBuckets(dealer),
  Pone: createStarterBuckets(pone),
});

const customTable = {
  [ACE_KING_UNSUITED]: createRoleBuckets(
    LOW_DEALER_CRIB_POINTS,
    LOW_CRIB_POINTS,
  ),
  [ACE_TWO_UNSUITED]: createRoleBuckets(
    DEALER_CRIB_POINTS,
    PONE_HIGH_CRIB_POINTS,
  ),
  [TWO_KING_UNSUITED]: createRoleBuckets(
    LOW_DEALER_CRIB_POINTS,
    LOW_CRIB_POINTS,
  ),
} as ExpectedCribPointsTable;

const round = (expectedHandPoints: number) =>
  Math.round(expectedHandPoints * TEN_EXP_ROUND_DIGITS) / TEN_EXP_ROUND_DIGITS;

const roundExpectedHandPoints = (
  actualScoredKeepDiscards: ScoredKeepDiscard<Card>[],
) =>
  actualScoredKeepDiscards.map((scoredKeepDiscard) => ({
    ...scoredKeepDiscard,
    expectedHandPoints: round(scoredKeepDiscard.expectedHandPoints),
    expectedNetPoints: round(scoredKeepDiscard.expectedNetPoints),
    expectedPlayPoints: {
      ...scoredKeepDiscard.expectedPlayPoints,
      delta: round(scoredKeepDiscard.expectedPlayPoints.delta),
    },
    signedExpectedCribPoints: round(scoredKeepDiscard.signedExpectedCribPoints),
  }));

const getCustomTableFirstResult = (cribRole: CribRole) =>
  scoreDeal(
    parseHand(TEST_HAND),
    cribRole,
    customTable,
  )[0] as ScoredKeepDiscard<Card>;

function expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
  cards: readonly Card[],
): void {
  const actualScoredKeepDiscards = roundExpectedHandPoints(scoreDeal(cards));

  const toComparison = (scored: ScoredKeepDiscard<Card>) => ({
    discard: scored.discard,
    expectedHandPoints: scored.expectedHandPoints,
    expectedNetPoints: scored.expectedNetPoints,
    expectedPlayPoints: scored.expectedPlayPoints,
    handPoints: scored.handPoints,
    keep: scored.keep,
    signedExpectedCribPoints: scored.signedExpectedCribPoints,
  });
  const actualForComparison = actualScoredKeepDiscards.map(toComparison);

  expect(actualForComparison).toMatchSnapshot();
}

describe("allScoredKeepDiscardsByScoreDescending", () => {
  it("should return nothing for an empty deal", () => {
    expect(scoreDeal([])).toStrictEqual([]);
  });

  it("should return nothing for a one-card deal", () => {
    expect(scoreDeal([ACE])).toStrictEqual([]);
  });

  it("two card deal with duplicate cards throws", () => {
    expect(() => scoreDeal([ACE, ACE])).toThrow("Duplicate cards exist");
  });

  it("two card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([ACE, TWO]);
  });

  it("three card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([
      JACK,
      FOUR,
      FIVE,
    ]);
  });

  it("four card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([
      TEN,
      TWO,
      EIGHT,
      FIVE,
    ]);
  });

  it("five card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([
      TEN,
      THREE,
      JACK,
      FIVE,
      FOUR,
    ]);
  });

  it("six card descending rank order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([
      KING,
      QUEEN,
      JACK,
      SIX,
      FIVE,
      FOUR,
    ]);
  });

  it("six card deal with rank ties", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      parseHand("AH,AD,2H,2D,3H,3D"),
    );
  });

  it("adds dealer crib points into net points", () => {
    const result = getCustomTableFirstResult(CribRole.Dealer);

    expect(result.expectedCribPoints).toBe(DEALER_CRIB_POINTS);
    expect(result.signedExpectedCribPoints).toBe(DEALER_CRIB_POINTS);
    expect(result.expectedNetPoints).toBe(
      result.expectedHandPoints +
        DEALER_CRIB_POINTS +
        result.expectedPlayPoints.delta,
    );
  });

  it("subtracts pone crib points from net points", () => {
    const result = getCustomTableFirstResult(CribRole.Pone);

    expect(result.expectedCribPoints).toBe(LOW_CRIB_POINTS);
    expect(result.signedExpectedCribPoints).toBe(-LOW_CRIB_POINTS);
    expect(result.expectedNetPoints).toBe(
      result.expectedHandPoints -
        LOW_CRIB_POINTS +
        result.expectedPlayPoints.delta,
    );
  });

  it("sorts by net points descending", () => {
    const result = getCustomTableFirstResult(CribRole.Dealer);

    expect(result.discard).toStrictEqual(parseHand("2D,AH"));
  });
});
