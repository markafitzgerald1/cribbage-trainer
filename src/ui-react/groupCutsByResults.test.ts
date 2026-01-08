import { CARDS, Rank } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import type { CutContribution } from "../game/expectedCutAddedPoints";
import { groupCutsByResults } from "./groupCutsByResults";

const CARD_COUNT_FOR_UNIQUE_RANK = 4;
const CARD_COUNT_FOR_THREE_OF_A_KIND = 1;
const CARD_COUNT_FOR_PAIR = 2;
const CARD_COUNT_FOR_SINGLE = 3;
const PAIR_POINTS = 2;
const TWO_PAIR_POINTS = 4;
const THREE_OF_KIND_POINTS = 6;
const FIFTEEN_POINTS = 2;
const DOUBLE_FIFTEEN_POINTS = 4;
const EIGHT_POINTS = 8;
const TWELVE_POINTS = 12;

describe("groupCutsByResults", () => {
  it("returns empty array for no contributions", () => {
    const result = groupCutsByResults([], [], []);

    expect(result).toStrictEqual([]);
  });

  /* jscpd:ignore-start */
  it("groups cuts with same points across all categories", () => {
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

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      cutCount: EIGHT_POINTS,
      fifteensPoints: FIFTEEN_POINTS,
      pairsPoints: TWO_PAIR_POINTS,
      runsPoints: 0,
      totalPoints: THREE_OF_KIND_POINTS,
    });
    expect(results[0]?.cuts).toContain(Rank.ACE);
    expect(results[0]?.cuts).toContain(Rank.TWO);
  });

  it("separates cuts with different point totals", () => {
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

    expect(results).toHaveLength(PAIR_POINTS);
    expect(results[0]).toHaveProperty("totalPoints", DOUBLE_FIFTEEN_POINTS);
    expect(results[1]).toHaveProperty("totalPoints", FIFTEEN_POINTS);
  });

  it("sorts results by total points descending", () => {
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
  });

  it("handles cuts that only contribute to runs category", () => {
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

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      cutCount: CARD_COUNT_FOR_UNIQUE_RANK,
      fifteensPoints: 0,
      pairsPoints: 0,
      runsPoints: EIGHT_POINTS,
      totalPoints: EIGHT_POINTS,
    });
  });

  it("sorts by cut count descending when total points are equal", () => {
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

    expect(results).toHaveLength(1);
    expect(results[0]?.cutCount).toBe(THREE_OF_KIND_POINTS);
  });

  it("sorts by cut count when points are equal and groups are separate", () => {
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

    expect(results).toHaveLength(PAIR_POINTS);
    expect(results[0]).toHaveProperty("totalPoints", DOUBLE_FIFTEEN_POINTS);
    expect(results[1]).toHaveProperty("totalPoints", DOUBLE_FIFTEEN_POINTS);
    expect(results[0]).toHaveProperty("cutCount", CARD_COUNT_FOR_UNIQUE_RANK);
    expect(results[1]).toHaveProperty("cutCount", CARD_COUNT_FOR_PAIR);
  });

  it("handles cuts that only contribute to pairs category", () => {
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

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      cutCount: CARD_COUNT_FOR_SINGLE,
      fifteensPoints: 0,
      pairsPoints: THREE_OF_KIND_POINTS,
      runsPoints: 0,
      totalPoints: THREE_OF_KIND_POINTS,
    });
  });

  it("uses fifteens count when same rank appears in multiple categories", () => {
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

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      cutCount: CARD_COUNT_FOR_UNIQUE_RANK,
      fifteensPoints: FIFTEEN_POINTS,
      pairsPoints: DOUBLE_FIFTEEN_POINTS,
      runsPoints: THREE_OF_KIND_POINTS,
      totalPoints: TWELVE_POINTS,
    });
  });
  /* jscpd:ignore-end */
});
