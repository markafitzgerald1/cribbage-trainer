import { CARDS, Rank } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import type { CutContribution } from "../game/expectedCutAddedPoints";
import { groupCutsByResults } from "./groupCutsByResults";

const CARD_COUNT_FOR_UNIQUE_RANK = 4;
const CARD_COUNT_FOR_THREE_OF_A_KIND = 1;
const CARD_COUNT_FOR_PAIR = 2;
const CARD_COUNT_FOR_SINGLE = 3;
const PAIR_POINTS = 2;
const RUN_OF_THREE_POINTS = 3;
const TWO_PAIR_POINTS = 4;
const THREE_OF_KIND_POINTS = 6;
const FIFTEEN_POINTS = 2;
const DOUBLE_FIFTEEN_POINTS = 4;
const EIGHT_POINTS = 8;
const TWELVE_POINTS = 12;
const ALL_RANKS_CUT_COUNT = 52;
const TWELVE_RANKS_CUT_COUNT = 48;
const ELEVEN_RANKS_CUT_COUNT = 44;
const TEN_RANKS_CUT_COUNT = 40;
const TOTAL_RANKS = 13;

const EMPTY: CutContribution[] = [];

/* jscpd:ignore-start - repetitive array initialization for test constants */
const ALL_FOUR_REMAINING: readonly number[] = [
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
  CARD_COUNT_FOR_UNIQUE_RANK,
];
/* jscpd:ignore-end */

describe("groupCutsByResults", () => {
  it("returns all ranks as zero-point group when no contributions", () => {
    const result = groupCutsByResults({
      cutCountsRemaining: ALL_FOUR_REMAINING,
      fifteens: EMPTY,
      pairs: EMPTY,
      runs: EMPTY,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      cutCount: ALL_RANKS_CUT_COUNT,
      fifteensPoints: 0,
      pairsPoints: 0,
      runsPoints: 0,
      totalPoints: 0,
    });
    expect(result[0]?.cuts).toHaveLength(TOTAL_RANKS);
  });

  /* jscpd:ignore-start */
  it("groups cuts with same points across all categories plus zero-point group", () => {
    const fifteens: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_UNIQUE_RANK,
        cutCard: CARDS.ACE,
        points: FIFTEEN_POINTS,
      },
      {
        count: CARD_COUNT_FOR_UNIQUE_RANK,
        cutCard: CARDS.TWO,
        points: FIFTEEN_POINTS,
      },
    ];
    const pairs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_UNIQUE_RANK,
        cutCard: CARDS.ACE,
        points: TWO_PAIR_POINTS,
      },
      {
        count: CARD_COUNT_FOR_UNIQUE_RANK,
        cutCard: CARDS.TWO,
        points: TWO_PAIR_POINTS,
      },
    ];

    const results = groupCutsByResults({
      cutCountsRemaining: ALL_FOUR_REMAINING,
      fifteens,
      pairs,
      runs: EMPTY,
    });

    expect(results).toHaveLength(PAIR_POINTS);
    expect(results[0]).toMatchObject({
      cutCount: EIGHT_POINTS,
      fifteensPoints: FIFTEEN_POINTS,
      pairsPoints: TWO_PAIR_POINTS,
      runsPoints: 0,
      totalPoints: THREE_OF_KIND_POINTS,
    });
    expect(results[0]?.cuts).toContain(Rank.ACE);
    expect(results[0]?.cuts).toContain(Rank.TWO);
    expect(results[1]).toMatchObject({
      cutCount: ELEVEN_RANKS_CUT_COUNT,
      totalPoints: 0,
    });
  });

  it("separates cuts with different point totals plus zero-point group", () => {
    const fifteens: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_SINGLE,
        cutCard: CARDS.FIVE,
        points: FIFTEEN_POINTS,
      },
    ];
    const pairs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_SINGLE,
        cutCard: CARDS.FIVE,
        points: FIFTEEN_POINTS,
      },
      {
        count: CARD_COUNT_FOR_UNIQUE_RANK,
        cutCard: CARDS.KING,
        points: FIFTEEN_POINTS,
      },
    ];

    const results = groupCutsByResults({
      cutCountsRemaining: ALL_FOUR_REMAINING,
      fifteens,
      pairs,
      runs: EMPTY,
    });

    expect(results).toHaveLength(RUN_OF_THREE_POINTS);
    expect(results[0]).toHaveProperty("totalPoints", DOUBLE_FIFTEEN_POINTS);
    expect(results[1]).toHaveProperty("totalPoints", FIFTEEN_POINTS);
    expect(results[PAIR_POINTS]).toMatchObject({
      cutCount: ELEVEN_RANKS_CUT_COUNT,
      totalPoints: 0,
    });
  });

  it("sorts results by total points descending with zero-point group last", () => {
    const fifteens: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_THREE_OF_A_KIND,
        cutCard: CARDS.FIVE,
        points: FIFTEEN_POINTS,
      },
    ];
    const pairs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_THREE_OF_A_KIND,
        cutCard: CARDS.KING,
        points: TWO_PAIR_POINTS,
      },
    ];
    const runs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_THREE_OF_A_KIND,
        cutCard: CARDS.ACE,
        points: TWELVE_POINTS,
      },
    ];

    const results = groupCutsByResults({
      cutCountsRemaining: ALL_FOUR_REMAINING,
      fifteens,
      pairs,
      runs,
    });

    expect(results[0]?.totalPoints).toBe(TWELVE_POINTS);
    expect(results[1]?.totalPoints).toBe(TWO_PAIR_POINTS);
    expect(results[PAIR_POINTS]?.totalPoints).toBe(FIFTEEN_POINTS);
    expect(results[RUN_OF_THREE_POINTS]?.totalPoints).toBe(0);
    expect(results[RUN_OF_THREE_POINTS]?.cutCount).toBe(TEN_RANKS_CUT_COUNT);
  });

  it("handles cuts that only contribute to runs category plus zero-point group", () => {
    const runs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_UNIQUE_RANK,
        cutCard: CARDS.KING,
        points: EIGHT_POINTS,
      },
    ];

    const results = groupCutsByResults({
      cutCountsRemaining: ALL_FOUR_REMAINING,
      fifteens: EMPTY,
      pairs: EMPTY,
      runs,
    });

    expect(results).toHaveLength(PAIR_POINTS);
    expect(results[0]).toMatchObject({
      cutCount: CARD_COUNT_FOR_UNIQUE_RANK,
      fifteensPoints: 0,
      pairsPoints: 0,
      runsPoints: EIGHT_POINTS,
      totalPoints: EIGHT_POINTS,
    });
    expect(results[1]).toMatchObject({
      cutCount: TWELVE_RANKS_CUT_COUNT,
      totalPoints: 0,
    });
  });

  it("sorts by cut count descending when total points are equal with zero-point group", () => {
    const fifteens: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_PAIR,
        cutCard: CARDS.FIVE,
        points: FIFTEEN_POINTS,
      },
      {
        count: CARD_COUNT_FOR_UNIQUE_RANK,
        cutCard: CARDS.SIX,
        points: FIFTEEN_POINTS,
      },
    ];

    const results = groupCutsByResults({
      cutCountsRemaining: ALL_FOUR_REMAINING,
      fifteens,
      pairs: EMPTY,
      runs: EMPTY,
    });

    expect(results).toHaveLength(PAIR_POINTS);
    expect(results[0]?.cutCount).toBe(EIGHT_POINTS);
    expect(results[1]).toMatchObject({
      cutCount: ELEVEN_RANKS_CUT_COUNT,
      totalPoints: 0,
    });
  });

  it("sorts by cut count when points are equal and groups are separate plus zero-point group", () => {
    const fiveWithTwoRemaining: readonly number[] = [
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_PAIR,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
    ];
    const fifteens: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_PAIR,
        cutCard: CARDS.FIVE,
        points: FIFTEEN_POINTS,
      },
      {
        count: CARD_COUNT_FOR_UNIQUE_RANK,
        cutCard: CARDS.KING,
        points: DOUBLE_FIFTEEN_POINTS,
      },
    ];
    const pairs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_PAIR,
        cutCard: CARDS.FIVE,
        points: FIFTEEN_POINTS,
      },
    ];

    const results = groupCutsByResults({
      cutCountsRemaining: fiveWithTwoRemaining,
      fifteens,
      pairs,
      runs: EMPTY,
    });

    expect(results).toHaveLength(RUN_OF_THREE_POINTS);
    expect(results[0]).toMatchObject({
      cutCount: CARD_COUNT_FOR_UNIQUE_RANK,
      totalPoints: DOUBLE_FIFTEEN_POINTS,
    });
    expect(results[1]).toMatchObject({
      cutCount: CARD_COUNT_FOR_PAIR,
      totalPoints: DOUBLE_FIFTEEN_POINTS,
    });
    expect(results[PAIR_POINTS]).toMatchObject({
      cutCount: ELEVEN_RANKS_CUT_COUNT,
      totalPoints: 0,
    });
  });

  it("handles cuts that only contribute to pairs category plus zero-point group", () => {
    const queenWithThreeRemaining: readonly number[] = [
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_SINGLE,
      CARD_COUNT_FOR_UNIQUE_RANK,
    ];
    const pairs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_SINGLE,
        cutCard: CARDS.QUEEN,
        points: THREE_OF_KIND_POINTS,
      },
    ];

    const results = groupCutsByResults({
      cutCountsRemaining: queenWithThreeRemaining,
      fifteens: EMPTY,
      pairs,
      runs: EMPTY,
    });

    expect(results).toHaveLength(PAIR_POINTS);
    expect(results[0]).toMatchObject({
      cutCount: CARD_COUNT_FOR_SINGLE,
      fifteensPoints: 0,
      pairsPoints: THREE_OF_KIND_POINTS,
      runsPoints: 0,
      totalPoints: THREE_OF_KIND_POINTS,
    });
    expect(results[1]).toMatchObject({
      cutCount: TWELVE_RANKS_CUT_COUNT,
      totalPoints: 0,
    });
  });

  it("uses fifteens count when same rank appears in multiple categories plus zero-point group", () => {
    const fifteens: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_UNIQUE_RANK,
        cutCard: CARDS.FIVE,
        points: FIFTEEN_POINTS,
      },
    ];
    const pairs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_SINGLE,
        cutCard: CARDS.FIVE,
        points: DOUBLE_FIFTEEN_POINTS,
      },
    ];
    const runs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_PAIR,
        cutCard: CARDS.FIVE,
        points: THREE_OF_KIND_POINTS,
      },
    ];

    const results = groupCutsByResults({
      cutCountsRemaining: ALL_FOUR_REMAINING,
      fifteens,
      pairs,
      runs,
    });

    expect(results).toHaveLength(PAIR_POINTS);
    expect(results[0]).toMatchObject({
      cutCount: CARD_COUNT_FOR_UNIQUE_RANK,
      fifteensPoints: FIFTEEN_POINTS,
      pairsPoints: DOUBLE_FIFTEEN_POINTS,
      runsPoints: THREE_OF_KIND_POINTS,
      totalPoints: TWELVE_POINTS,
    });
    expect(results[1]).toMatchObject({
      cutCount: TWELVE_RANKS_CUT_COUNT,
      totalPoints: 0,
    });
  });

  it("uses cutCountsRemaining for zero-point ranks that have cards in hand", () => {
    const customCutCounts: readonly number[] = [
      CARD_COUNT_FOR_SINGLE,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_PAIR,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
    ];

    const results = groupCutsByResults({
      cutCountsRemaining: customCutCounts,
      fifteens: EMPTY,
      pairs: EMPTY,
      runs: EMPTY,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      cutCount: ALL_RANKS_CUT_COUNT - RUN_OF_THREE_POINTS,
      totalPoints: 0,
    });
  });

  it("treats undefined values in cutCountsRemaining as zero", () => {
    // Intentionally create sparse array to test defensive fallback
    const sparseCutCounts: readonly number[] = [
      CARD_COUNT_FOR_UNIQUE_RANK,
      CARD_COUNT_FOR_UNIQUE_RANK,
    ];

    const results = groupCutsByResults({
      cutCountsRemaining: sparseCutCounts,
      fifteens: EMPTY,
      pairs: EMPTY,
      runs: EMPTY,
    });

    expect(results).toHaveLength(1);
    // Only first two ranks have defined counts (4 + 4 = 8)
    // Remaining 11 ranks have undefined which falls back to 0
    expect(results[0]).toMatchObject({
      cutCount: EIGHT_POINTS,
      totalPoints: 0,
    });
  });
  /* jscpd:ignore-end */
});
