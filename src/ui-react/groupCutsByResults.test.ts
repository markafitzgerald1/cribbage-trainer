/* jscpd:ignore-start */
import { CARDS, type Card } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import type { CutContribution } from "../game/expectedCutAddedPoints";
import { groupCutsByResults } from "./groupCutsByResults";
/* jscpd:ignore-end */

const CARD_COUNT_FOR_UNIQUE_RANK = 4;
const CARD_COUNT_FOR_THREE_OF_A_KIND = 1;
const CARD_COUNT_FOR_PAIR = 2;
const CARD_COUNT_FOR_SINGLE = 3;
const TWO_PAIR_POINTS = 4;
const THREE_OF_KIND_POINTS = 6;
const FIFTEEN_POINTS = 2;
const DOUBLE_FIFTEEN_POINTS = 4;
const EIGHT_POINTS = 8;
const TWELVE_POINTS = 12;
const ALL_RANKS_CUT_COUNT = 52;
const TOTAL_RANKS = 13;

const createCutCounts = (
  overrides: Record<number, number> = {},
): readonly number[] =>
  Array.from(
    { length: TOTAL_RANKS },
    (_, index) => overrides[index] ?? CARD_COUNT_FOR_UNIQUE_RANK,
  );

const ALL_FOUR_REMAINING = createCutCounts();

const makeContribution = (
  count: number,
  cutCard: Card,
  points: number,
): CutContribution => ({
  count,
  cutCard,
  points,
});

function getContributions(
  contributions: readonly CutContribution[] | undefined,
): readonly CutContribution[] {
  if (typeof contributions === "undefined") {
    return [];
  }
  return contributions;
}

interface TestArgs {
  discard?: readonly Card[];
  fifteens?: readonly CutContribution[];
  flushes?: readonly CutContribution[];
  keep?: readonly Card[];
  nobs?: readonly CutContribution[];
  pairs?: readonly CutContribution[];
  runs?: readonly CutContribution[];
}

describe("groupCutsByResults", () => {
  it.each([
    [
      "returns all ranks as zero-point group when no contributions",
      { cutCountsRemaining: ALL_FOUR_REMAINING },
      [
        {
          cutCount: ALL_RANKS_CUT_COUNT,
          cuts: expect.any(Array),
          fifteensPoints: 0,
          pairsPoints: 0,
          runsPoints: 0,
          totalPoints: 0,
        },
      ],
    ],
    [
      "groups cuts with same points across all categories plus zero-point group",
      {
        cutCountsRemaining: ALL_FOUR_REMAINING,
        fifteens: [
          makeContribution(
            CARD_COUNT_FOR_UNIQUE_RANK,
            CARDS.ACE,
            FIFTEEN_POINTS,
          ),
          makeContribution(
            CARD_COUNT_FOR_UNIQUE_RANK,
            CARDS.TWO,
            FIFTEEN_POINTS,
          ),
        ],
        pairs: [
          makeContribution(
            CARD_COUNT_FOR_UNIQUE_RANK,
            CARDS.ACE,
            TWO_PAIR_POINTS,
          ),
          makeContribution(
            CARD_COUNT_FOR_UNIQUE_RANK,
            CARDS.TWO,
            TWO_PAIR_POINTS,
          ),
        ],
      },
      [
        {
          cutCount: 2,
          cuts: expect.any(Array),
          fifteensPoints: FIFTEEN_POINTS,
          pairsPoints: TWO_PAIR_POINTS,
          runsPoints: 0,
          totalPoints: FIFTEEN_POINTS + TWO_PAIR_POINTS,
        },
        { cutCount: 50, totalPoints: 0 },
      ],
    ],
    [
      "separates cuts with different point totals plus zero-point group",
      {
        cutCountsRemaining: ALL_FOUR_REMAINING,
        fifteens: [
          makeContribution(CARD_COUNT_FOR_SINGLE, CARDS.FIVE, FIFTEEN_POINTS),
        ],
        pairs: [
          makeContribution(CARD_COUNT_FOR_SINGLE, CARDS.FIVE, FIFTEEN_POINTS),
          makeContribution(
            CARD_COUNT_FOR_UNIQUE_RANK,
            CARDS.KING,
            FIFTEEN_POINTS,
          ),
        ],
      },
      [
        { totalPoints: DOUBLE_FIFTEEN_POINTS },
        { totalPoints: FIFTEEN_POINTS },
        { cutCount: 50, totalPoints: 0 },
      ],
    ],
    [
      "sorts results by total points descending with zero-point group last",
      {
        cutCountsRemaining: ALL_FOUR_REMAINING,
        fifteens: [
          makeContribution(
            CARD_COUNT_FOR_THREE_OF_A_KIND,
            CARDS.FIVE,
            FIFTEEN_POINTS,
          ),
        ],
        pairs: [
          makeContribution(
            CARD_COUNT_FOR_THREE_OF_A_KIND,
            CARDS.KING,
            TWO_PAIR_POINTS,
          ),
        ],
        runs: [
          makeContribution(
            CARD_COUNT_FOR_THREE_OF_A_KIND,
            CARDS.ACE,
            TWELVE_POINTS,
          ),
        ],
      },
      [
        { totalPoints: TWELVE_POINTS },
        { totalPoints: TWO_PAIR_POINTS },
        { totalPoints: FIFTEEN_POINTS },
        { cutCount: 49, totalPoints: 0 },
      ],
    ],
    [
      "handles cuts that only contribute to runs category plus zero-point group",
      {
        cutCountsRemaining: ALL_FOUR_REMAINING,
        runs: [
          makeContribution(
            CARD_COUNT_FOR_UNIQUE_RANK,
            CARDS.KING,
            EIGHT_POINTS,
          ),
        ],
      },
      [
        {
          cutCount: 1,
          fifteensPoints: 0,
          pairsPoints: 0,
          runsPoints: EIGHT_POINTS,
          totalPoints: EIGHT_POINTS,
        },
        { cutCount: 51, totalPoints: 0 },
      ],
    ],
    [
      "sorts by cut count descending when total points are equal with zero-point group",
      {
        cutCountsRemaining: ALL_FOUR_REMAINING,
        fifteens: [
          makeContribution(CARD_COUNT_FOR_PAIR, CARDS.FIVE, FIFTEEN_POINTS),
          makeContribution(
            CARD_COUNT_FOR_UNIQUE_RANK,
            CARDS.SIX,
            FIFTEEN_POINTS,
          ),
        ],
      },
      [{ cutCount: 2 }, { cutCount: 50, totalPoints: 0 }],
    ],
    [
      "sorts by cut count when points are equal and groups are separate plus zero-point group",
      {
        cutCountsRemaining: createCutCounts({ 4: CARD_COUNT_FOR_PAIR }),
        fifteens: [
          makeContribution(CARD_COUNT_FOR_PAIR, CARDS.FIVE, FIFTEEN_POINTS),
          makeContribution(
            CARD_COUNT_FOR_UNIQUE_RANK,
            CARDS.KING,
            DOUBLE_FIFTEEN_POINTS,
          ),
        ],
        pairs: [
          makeContribution(CARD_COUNT_FOR_PAIR, CARDS.FIVE, FIFTEEN_POINTS),
        ],
      },
      [
        {
          cutCount: 1,
          totalPoints: DOUBLE_FIFTEEN_POINTS,
        },
        { cutCount: 1, totalPoints: DOUBLE_FIFTEEN_POINTS },
        { cutCount: 50, totalPoints: 0 },
      ],
    ],
    [
      "handles cuts that only contribute to pairs category plus zero-point group",
      {
        cutCountsRemaining: createCutCounts({ 11: CARD_COUNT_FOR_SINGLE }),
        pairs: [
          makeContribution(
            CARD_COUNT_FOR_SINGLE,
            CARDS.QUEEN,
            THREE_OF_KIND_POINTS,
          ),
        ],
      },
      [
        {
          cutCount: 1,
          fifteensPoints: 0,
          pairsPoints: THREE_OF_KIND_POINTS,
          runsPoints: 0,
          totalPoints: THREE_OF_KIND_POINTS,
        },
        { cutCount: 51, totalPoints: 0 },
      ],
    ],
    [
      "uses fifteens count when same rank appears in multiple categories plus zero-point group",
      {
        cutCountsRemaining: ALL_FOUR_REMAINING,
        fifteens: [
          makeContribution(
            CARD_COUNT_FOR_UNIQUE_RANK,
            CARDS.FIVE,
            FIFTEEN_POINTS,
          ),
        ],
        pairs: [
          makeContribution(
            CARD_COUNT_FOR_SINGLE,
            CARDS.FIVE,
            DOUBLE_FIFTEEN_POINTS,
          ),
        ],
        runs: [
          makeContribution(
            CARD_COUNT_FOR_PAIR,
            CARDS.FIVE,
            THREE_OF_KIND_POINTS,
          ),
        ],
      },
      [
        {
          cutCount: 1,
          fifteensPoints: FIFTEEN_POINTS,
          pairsPoints: DOUBLE_FIFTEEN_POINTS,
          runsPoints: THREE_OF_KIND_POINTS,
          totalPoints: TWELVE_POINTS,
        },
        { cutCount: 51, totalPoints: 0 },
      ],
    ],
    [
      "uses cutCountsRemaining for zero-point ranks that have cards in hand",
      {
        cutCountsRemaining: createCutCounts({
          0: CARD_COUNT_FOR_SINGLE,
          5: CARD_COUNT_FOR_PAIR,
        }),
      },
      [{ cutCount: 52, totalPoints: 0 }],
    ],
    [
      "treats undefined values in cutCountsRemaining as zero",
      {
        cutCountsRemaining: [
          CARD_COUNT_FOR_UNIQUE_RANK,
          CARD_COUNT_FOR_UNIQUE_RANK,
        ],
      },
      [{ cutCount: 52, totalPoints: 0 }],
    ],
    [
      "handles flushes and nobs correctly",
      {
        cutCountsRemaining: ALL_FOUR_REMAINING,
        flushes: [makeContribution(CARD_COUNT_FOR_SINGLE, CARDS.FIVE, 4)],
        nobs: [makeContribution(CARD_COUNT_FOR_SINGLE, CARDS.JACK, 1)],
      },
      [
        {
          cutCount: 1,
          flushesPoints: 4,
          nobsPoints: 0,
          totalPoints: 4,
        },
        {
          cutCount: 1,
          flushesPoints: 0,
          nobsPoints: 1,
          totalPoints: 1,
        },
        { cutCount: 50, totalPoints: 0 },
      ],
    ],
  ] as const)("%s", (_, args, expectedGroups) => {
    // We cast args to TestArgs to bypass complex readonly inference issues with const
    const typedArgs = args as unknown as TestArgs;
    const {
      discard = [],
      fifteens,
      flushes,
      keep = [],
      nobs,
      pairs,
      runs,
    } = typedArgs;

    const result = groupCutsByResults({
      availableCards: [],
      discard,
      fifteens: getContributions(fifteens),
      flushes: getContributions(flushes),
      keep,
      nobs: getContributions(nobs),
      pairs: getContributions(pairs),
      runs: getContributions(runs),
    });

    expect(result).toMatchObject(
      expectedGroups as unknown as Record<string, unknown>[],
    );
  });
});
