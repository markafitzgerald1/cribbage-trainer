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

describe("groupCutsByResults", () => {
  it("returns all ranks as zero-point group when no contributions", () => {
    const result = groupCutsByResults([], [], []);

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
    const runs: CutContribution[] = [];

    const results = groupCutsByResults(fifteens, pairs, runs);

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
    const runs: CutContribution[] = [];

    const results = groupCutsByResults(fifteens, pairs, runs);

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

    const results = groupCutsByResults(fifteens, pairs, runs);

    expect(results[0]?.totalPoints).toBe(TWELVE_POINTS);
    expect(results[1]?.totalPoints).toBe(TWO_PAIR_POINTS);
    expect(results[PAIR_POINTS]?.totalPoints).toBe(FIFTEEN_POINTS);
    expect(results[RUN_OF_THREE_POINTS]?.totalPoints).toBe(0);
    expect(results[RUN_OF_THREE_POINTS]?.cutCount).toBe(TEN_RANKS_CUT_COUNT);
  });

  it("handles cuts that only contribute to runs category plus zero-point group", () => {
    const fifteens: CutContribution[] = [];
    const pairs: CutContribution[] = [];
    const runs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_UNIQUE_RANK,
        cutCard: CARDS.KING,
        points: EIGHT_POINTS,
      },
    ];

    const results = groupCutsByResults(fifteens, pairs, runs);

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
    const pairs: CutContribution[] = [];
    const runs: CutContribution[] = [];

    const results = groupCutsByResults(fifteens, pairs, runs);

    expect(results).toHaveLength(PAIR_POINTS);
    expect(results[0]?.cutCount).toBe(THREE_OF_KIND_POINTS);
    expect(results[1]).toMatchObject({
      cutCount: ELEVEN_RANKS_CUT_COUNT,
      totalPoints: 0,
    });
  });

  it("sorts by cut count when points are equal and groups are separate plus zero-point group", () => {
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
    const runs: CutContribution[] = [];

    const results = groupCutsByResults(fifteens, pairs, runs);

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
    const fifteens: CutContribution[] = [];
    const pairs: CutContribution[] = [
      {
        count: CARD_COUNT_FOR_SINGLE,
        cutCard: CARDS.QUEEN,
        points: THREE_OF_KIND_POINTS,
      },
    ];
    const runs: CutContribution[] = [];

    const results = groupCutsByResults(fifteens, pairs, runs);

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

    const results = groupCutsByResults(fifteens, pairs, runs);

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
  /* jscpd:ignore-end */
});
