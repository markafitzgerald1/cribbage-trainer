import { describe, expect, it } from "@jest/globals";
import { CARDS, type Card, Rank, Suit, parseCard } from "../game/Card";
import {
  type GroupedCut,
  groupCutsByResults,
} from "./groupCutsByResults";
import type { CutContribution } from "../game/expectedCutAddedPoints";

const CARD_COUNT_FOR_UNIQUE_RANK = 4;
const CARD_COUNT_FOR_THREE_OF_A_KIND = 1;
const CARD_COUNT_FOR_PAIR = 2;
const CARD_COUNT_FOR_SINGLE = 3;
const TWO_PAIR_POINTS = 4;
const THREE_OF_KIND_POINTS = 6;
const FIFTEEN_POINTS = 2;
const DOUBLE_FIFTEEN_POINTS = 4;
const FOUR_CARD_FLUSH_POINTS = 4;
const NOBS_POINTS = 1;
const EIGHT_RUN_POINTS = 8;
const TWELVE_RUN_POINTS = 12;

const FIFTEEN_AND_PAIR_POINTS = FIFTEEN_POINTS + TWO_PAIR_POINTS;
const FIFTEEN_PAIR_AND_RUN_POINTS =
  FIFTEEN_POINTS + DOUBLE_FIFTEEN_POINTS + THREE_OF_KIND_POINTS;
const ALL_RANKS_CUT_COUNT = 52;
const TOTAL_RANKS = 13;

const ONE_CUT = 1;
const TWO_CUTS = 2;
const THREE_CUTS = 3;
const ZERO_POINT_CUTS_AFTER_ONE_CUT = ALL_RANKS_CUT_COUNT - ONE_CUT;
const ZERO_POINT_CUTS_AFTER_TWO_CUTS = ALL_RANKS_CUT_COUNT - TWO_CUTS;
const ZERO_POINT_CUTS_AFTER_THREE_CUTS = ALL_RANKS_CUT_COUNT - THREE_CUTS;

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

const makeContributions = (
  count: number,
  cardLabels: readonly string[],
  points: number,
): readonly CutContribution[] =>
  cardLabels.map((cardLabel) =>
    makeContribution(count, parseCard(cardLabel), points),
  );

function getContributions(
  contributions: readonly CutContribution[] | undefined,
): readonly CutContribution[] {
  if (typeof contributions === "undefined") {
    return [];
  }
  return contributions;
}

function groupFifteensOnly(
  fifteens: readonly CutContribution[],
): ReturnType<typeof groupCutsByResults> {
  return groupCutsByResults({
    discard: [],
    fifteens,
    flushes: [],
    keep: [],
    nobs: [],
    pairs: [],
    runs: [],
  });
}

function cutGroup(
  cuts: readonly GroupedCut[],
  totalPoints: number,
): Pick<ReturnType<typeof groupCutsByResults>[number], "cuts" | "totalPoints"> {
  return { cuts, totalPoints };
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
          cutCount: TWO_CUTS,
          cuts: expect.any(Array),
          fifteensPoints: FIFTEEN_POINTS,
          pairsPoints: TWO_PAIR_POINTS,
          runsPoints: 0,
          totalPoints: FIFTEEN_AND_PAIR_POINTS,
        },
        { cutCount: ZERO_POINT_CUTS_AFTER_TWO_CUTS, totalPoints: 0 },
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
        { cutCount: ZERO_POINT_CUTS_AFTER_TWO_CUTS, totalPoints: 0 },
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
            TWELVE_RUN_POINTS,
          ),
        ],
      },
      [
        { totalPoints: TWELVE_RUN_POINTS },
        { totalPoints: TWO_PAIR_POINTS },
        { totalPoints: FIFTEEN_POINTS },
        { cutCount: ZERO_POINT_CUTS_AFTER_THREE_CUTS, totalPoints: 0 },
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
            EIGHT_RUN_POINTS,
          ),
        ],
      },
      [
        {
          cutCount: ONE_CUT,
          fifteensPoints: 0,
          pairsPoints: 0,
          runsPoints: EIGHT_RUN_POINTS,
          totalPoints: EIGHT_RUN_POINTS,
        },
        { cutCount: ZERO_POINT_CUTS_AFTER_ONE_CUT, totalPoints: 0 },
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
      [
        { cutCount: TWO_CUTS },
        { cutCount: ZERO_POINT_CUTS_AFTER_TWO_CUTS, totalPoints: 0 },
      ],
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
          cutCount: ONE_CUT,
          totalPoints: DOUBLE_FIFTEEN_POINTS,
        },
        { cutCount: ONE_CUT, totalPoints: DOUBLE_FIFTEEN_POINTS },
        { cutCount: ZERO_POINT_CUTS_AFTER_TWO_CUTS, totalPoints: 0 },
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
          cutCount: ONE_CUT,
          fifteensPoints: 0,
          pairsPoints: THREE_OF_KIND_POINTS,
          runsPoints: 0,
          totalPoints: THREE_OF_KIND_POINTS,
        },
        { cutCount: ZERO_POINT_CUTS_AFTER_ONE_CUT, totalPoints: 0 },
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
          cutCount: ONE_CUT,
          fifteensPoints: FIFTEEN_POINTS,
          pairsPoints: DOUBLE_FIFTEEN_POINTS,
          runsPoints: THREE_OF_KIND_POINTS,
          totalPoints: FIFTEEN_PAIR_AND_RUN_POINTS,
        },
        { cutCount: ZERO_POINT_CUTS_AFTER_ONE_CUT, totalPoints: 0 },
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
      [{ cutCount: ALL_RANKS_CUT_COUNT, totalPoints: 0 }],
    ],
    [
      "treats undefined values in cutCountsRemaining as zero",
      {
        cutCountsRemaining: [
          CARD_COUNT_FOR_UNIQUE_RANK,
          CARD_COUNT_FOR_UNIQUE_RANK,
        ],
      },
      [{ cutCount: ALL_RANKS_CUT_COUNT, totalPoints: 0 }],
    ],
    [
      "handles flushes and nobs correctly",
      {
        cutCountsRemaining: ALL_FOUR_REMAINING,
        flushes: [
          makeContribution(
            CARD_COUNT_FOR_SINGLE,
            CARDS.FIVE,
            FOUR_CARD_FLUSH_POINTS,
          ),
        ],
        nobs: [
          makeContribution(CARD_COUNT_FOR_SINGLE, CARDS.JACK, NOBS_POINTS),
        ],
      },
      [
        {
          cutCount: ONE_CUT,
          flushesPoints: FOUR_CARD_FLUSH_POINTS,
          nobsPoints: 0,
          totalPoints: FOUR_CARD_FLUSH_POINTS,
        },
        {
          cutCount: ONE_CUT,
          flushesPoints: 0,
          nobsPoints: NOBS_POINTS,
          totalPoints: NOBS_POINTS,
        },
        { cutCount: ZERO_POINT_CUTS_AFTER_TWO_CUTS, totalPoints: 0 },
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

  it("does not use rank shorthand when some cards of the same rank have different scores", () => {
    const result = groupFifteensOnly([
      makeContribution(
        CARD_COUNT_FOR_THREE_OF_A_KIND,
        parseCard("JC"),
        DOUBLE_FIFTEEN_POINTS,
      ),
      ...makeContributions(
        CARD_COUNT_FOR_THREE_OF_A_KIND,
        ["JS", "JH", "JD"],
        FIFTEEN_POINTS,
      ),
    ]);

    expect(result).toContainEqual(
      expect.objectContaining(
        cutGroup(
          [
            {
              isAllRemaining: false,
              rank: Rank.JACK,
              suits: [Suit.CLUBS],
            },
          ],
          DOUBLE_FIFTEEN_POINTS,
        ),
      ),
    );
    expect(result).toContainEqual(
      expect.objectContaining(
        cutGroup(
          [
            {
              isAllRemaining: false,
              rank: Rank.JACK,
              suits: [Suit.DIAMONDS, Suit.HEARTS, Suit.SPADES],
            },
          ],
          FIFTEEN_POINTS,
        ),
      ),
    );
  });

  it("renders a rank only when all remaining cards of that rank share a score tier", () => {
    const result = groupFifteensOnly(
      makeContributions(
        CARD_COUNT_FOR_UNIQUE_RANK,
        ["8C", "8D", "8H", "8S"],
        FIFTEEN_POINTS,
      ),
    );

    expect(result).toContainEqual(
      expect.objectContaining(
        cutGroup(
          [
            {
              isAllRemaining: true,
              rank: Rank.EIGHT,
              suits: [Suit.CLUBS, Suit.DIAMONDS, Suit.HEARTS, Suit.SPADES],
            },
          ],
          FIFTEEN_POINTS,
        ),
      ),
    );
  });
});
