import {
  type Card,
  INDICES_PER_SUIT,
  SUITS_PER_DECK,
  CARDS as card,
} from "../game/Card";
const {
  ACE,
  TWO,
  THREE,
  FOUR,
  FIVE,
  SIX,
  SEVEN,
  EIGHT,
  NINE,
  TEN,
  JACK,
  QUEEN,
  KING,
} = card;

import {
  type ScoredKeepDiscard,
  allScoredKeepDiscardsByExpectedScoreDescending,
} from "./analysis";
import { describe, expect, it } from "@jest/globals";
import { HAND_POINTS } from "../game/handPoints";
import { compareByExpectedScoreThenRankDescending } from "./compareByExpectedScoreDescending";
import { rankCounts } from "../game/rankCounts";

const { FIFTEEN_TWO, FIFTEEN_FOUR, FIFTEEN_SIX, PAIR } = HAND_POINTS;
const RUN_POINTS_PER_CARD = 1;
const RUN_LENGTH = 3;
const RUN = RUN_LENGTH * RUN_POINTS_PER_CARD;

type StarterPoints = [Card, number][];

function expectedPointsMap(
  handPoints: number,
  expectedHandPoints: StarterPoints = [],
  expectedAnyTenPoints?: number,
) {
  const result: {
    expectedAnyTenPoints?: number;
    expectedHandPoints: StarterPoints;
    handPoints: number;
  } = { expectedHandPoints, handPoints };
  if (typeof expectedAnyTenPoints !== "undefined") {
    result.expectedAnyTenPoints = expectedAnyTenPoints;
  }
  return result;
}

interface KeepExpectation {
  readonly anyTenPoints?: number;
  readonly handPoints: number;
  readonly keep: Card[];
  readonly starterPoints?: StarterPoints;
}

function buildExpectedPoints(expectations: KeepExpectation[]): Record<
  string,
  {
    expectedAnyTenPoints?: number;
    expectedHandPoints: StarterPoints;
    handPoints: number;
  }
> {
  return Object.fromEntries(
    expectations.map(({ anyTenPoints, handPoints, keep, starterPoints }) => [
      keep.map((keepCard) => keepCard.rankLabel).join("-"),
      expectedPointsMap(handPoints, starterPoints ?? [], anyTenPoints),
    ]),
  );
}

const tenLikeThreeFiveStarters: StarterPoints = [
  [SEVEN, FIFTEEN_TWO],
  [FIVE, FIFTEEN_TWO],
  [FOUR, RUN],
  [TWO, FIFTEEN_TWO],
];

const tenLikeThreeFourStarters: StarterPoints = [
  [EIGHT, FIFTEEN_TWO],
  [FIVE, FIFTEEN_TWO + RUN],
  [TWO, FIFTEEN_TWO + RUN],
  [ACE, FIFTEEN_TWO],
];

const tenLikeFiveFourStarters: StarterPoints = [
  [SIX, FIFTEEN_TWO + RUN],
  [FIVE, FIFTEEN_TWO],
  [THREE, RUN],
  [ACE, FIFTEEN_TWO],
];

const faceCardSixFiveFourStarters: StarterPoints = [
  [NINE, FIFTEEN_TWO],
  [SEVEN, RUN_POINTS_PER_CARD],
  [SIX, FIFTEEN_TWO + RUN],
  [FIVE, FIFTEEN_FOUR + RUN],
  [FOUR, FIFTEEN_TWO + RUN],
  [THREE, RUN_POINTS_PER_CARD],
  [ACE, FIFTEEN_TWO],
];

const faceCardRunPrefix: StarterPoints = [
  [KING, RUN],
  [QUEEN, RUN],
  [JACK, RUN],
  [TEN, RUN_POINTS_PER_CARD],
];
const sixFiveRunTail: StarterPoints = [
  [NINE, FIFTEEN_TWO],
  [SEVEN, RUN],
  [FIVE, FIFTEEN_FOUR],
  [FOUR, FIFTEEN_TWO + RUN],
];
const sixFourRunTail: StarterPoints = [
  [NINE, FIFTEEN_TWO],
  [FIVE, FIFTEEN_SIX + RUN],
  [ACE, FIFTEEN_FOUR],
];
const fiveFourRunTail: StarterPoints = [
  [SIX, FIFTEEN_TWO + RUN],
  [FIVE, FIFTEEN_FOUR],
  [THREE, RUN],
  [ACE, FIFTEEN_FOUR],
];

const queenNineFiveFifteenFourStarters: StarterPoints = [
  [QUEEN, RUN],
  [NINE, RUN],
  [FIVE, FIFTEEN_FOUR],
];

interface FaceCardPrefixGroup {
  readonly faceCards: readonly [Card, Card];
  readonly prefix: StarterPoints;
}

function buildFaceCardGroupExpectations(
  groups: FaceCardPrefixGroup[],
): KeepExpectation[] {
  return groups.flatMap(({ faceCards, prefix }) => [
    {
      anyTenPoints: FIFTEEN_TWO,
      handPoints: FIFTEEN_FOUR,
      keep: [...faceCards, SIX, FIVE],
      starterPoints: [...prefix, ...sixFiveRunTail],
    },
    {
      handPoints: 0,
      keep: [...faceCards, SIX, FOUR],
      starterPoints: [...prefix, ...sixFourRunTail],
    },
    {
      anyTenPoints: FIFTEEN_TWO,
      handPoints: FIFTEEN_FOUR,
      keep: [...faceCards, FIVE, FOUR],
      starterPoints: [...prefix, ...fiveFourRunTail],
    },
  ]);
}

describe("allScoredKeepDiscardsByScoreDescending", () => {
  it("should return nothing for an empty deal", () => {
    expect(allScoredKeepDiscardsByExpectedScoreDescending([])).toStrictEqual(
      [],
    );
  });

  it("should return nothing for a one-card deal", () => {
    expect(allScoredKeepDiscardsByExpectedScoreDescending([ACE])).toStrictEqual(
      [],
    );
  });

  it("two card deal with duplicate cards throws", () => {
    const cards = [ACE, ACE];

    expect(() => allScoredKeepDiscardsByExpectedScoreDescending(cards)).toThrow(
      "Duplicate cards exist",
    );
  });

  const TEN_NUMBER = 10;
  const ROUND_DIGITS = 14;
  const TEN_EXP_ROUND_DIGITS = TEN_NUMBER ** ROUND_DIGITS;
  const round = (expectedHandPoints: number) =>
    Math.round(expectedHandPoints * TEN_EXP_ROUND_DIGITS) /
    TEN_EXP_ROUND_DIGITS;
  const roundExpectedHandPoints = (
    actualScoredKeepDiscards: ScoredKeepDiscard<Card>[],
  ) =>
    actualScoredKeepDiscards.map((scoredKeepDiscard) => ({
      ...scoredKeepDiscard,
      expectedHandPoints: round(scoredKeepDiscard.expectedHandPoints),
    }));
  const CARDS_PER_DECK = INDICES_PER_SUIT * SUITS_PER_DECK;
  const TEN_INDEX_COUNT = 4;

  function expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
    cards: readonly Card[],
    expectedPoints: {
      [dashSeparatedKeepLabels: string]: {
        expectedAnyTenPoints?: number;
        expectedHandPoints: StarterPoints;
        handPoints: number;
      };
    },
  ): void {
    const cardRankCounts = rankCounts(cards);
    const REMAINING_DECK_SIZE = CARDS_PER_DECK - cards.length;
    const expectedScoredKeepDiscards: {
      discard: Card[];
      expectedHandPoints: number;
      handPoints: number;
      keep: Card[];
    }[] = [];
    for (let index1 = 0; index1 < cards.length; index1 += 1) {
      for (let index2 = index1 + 1; index2 < cards.length; index2 += 1) {
        const keep = cards.filter(
          (_, index) => index !== index1 && index !== index2,
        );
        const keepLabel = keep.map((keepCard) => keepCard.rankLabel).join("-");
        const { expectedAnyTenPoints, handPoints } = expectedPoints[keepLabel]!;
        const totalExpectedPairsPoints = keep
          .map(
            (keepCard) =>
              (SUITS_PER_DECK - cardRankCounts[keepCard.rank]!) * PAIR,
          )
          .reduce((sum, pairPoints) => sum + pairPoints, 0);
        const totalExpectedAnyTenPoints =
          (expectedAnyTenPoints ?? 0) *
          (TEN_INDEX_COUNT * SUITS_PER_DECK -
            cardRankCounts[TEN.rank]! -
            cardRankCounts[JACK.rank]! -
            cardRankCounts[QUEEN.rank]! -
            cardRankCounts[KING.rank]!);
        const totalExpectedHandPoints = expectedPoints[
          keepLabel
        ]!.expectedHandPoints.map(
          ([starterCard, extraPoints]) =>
            (SUITS_PER_DECK - cardRankCounts[starterCard.rank]!) * extraPoints,
        ).reduce((sum, extraPoints) => sum + extraPoints, 0);
        const expectedHandPoints = round(
          handPoints +
            (totalExpectedPairsPoints +
              totalExpectedAnyTenPoints +
              totalExpectedHandPoints) /
              REMAINING_DECK_SIZE,
        );
        expectedScoredKeepDiscards.push({
          discard: [cards[index1]!, cards[index2]!],
          expectedHandPoints,
          handPoints,
          keep,
        });
      }
    }
    expectedScoredKeepDiscards.sort((left, right) =>
      compareByExpectedScoreThenRankDescending(left, right),
    );
    const actualScoredKeepDiscards = roundExpectedHandPoints(
      allScoredKeepDiscardsByExpectedScoreDescending(cards),
    );

    interface ComparisonScored {
      readonly discard: readonly Card[];
      readonly expectedHandPoints: number;
      readonly handPoints: number;
      readonly keep: readonly Card[];
    }
    const toComparison = (scored: ComparisonScored) => ({
      discard: scored.discard,
      expectedHandPoints: scored.expectedHandPoints,
      handPoints: scored.handPoints,
      keep: scored.keep,
    });
    const actualForComparison = actualScoredKeepDiscards.map(toComparison);
    const expectedForComparison = expectedScoredKeepDiscards.map(toComparison);

    expect(actualForComparison).toStrictEqual(expectedForComparison);
  }

  it("two card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [ACE, TWO],
      buildExpectedPoints([{ handPoints: 0, keep: [] }]),
    );
  });

  it("three card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [JACK, FOUR, FIVE],
      buildExpectedPoints([
        { handPoints: 0, keep: [JACK], starterPoints: [[FIVE, FIFTEEN_TWO]] },
        { handPoints: 0, keep: [FOUR] },
        { anyTenPoints: FIFTEEN_TWO, handPoints: 0, keep: [FIVE] },
      ]),
    );
  });

  it("four card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [TEN, TWO, EIGHT, FIVE],
      buildExpectedPoints([
        {
          anyTenPoints: FIFTEEN_TWO,
          handPoints: 0,
          keep: [EIGHT, FIVE],
          starterPoints: [
            [SEVEN, FIFTEEN_TWO],
            [TWO, FIFTEEN_TWO],
          ],
        },
        {
          anyTenPoints: FIFTEEN_TWO,
          handPoints: 0,
          keep: [TWO, FIVE],
          starterPoints: [[EIGHT, FIFTEEN_TWO]],
        },
        {
          handPoints: 0,
          keep: [TWO, EIGHT],
          starterPoints: [
            [SEVEN, FIFTEEN_TWO],
            [FIVE, FIFTEEN_TWO],
          ],
        },
        {
          anyTenPoints: FIFTEEN_TWO,
          handPoints: FIFTEEN_TWO,
          keep: [TEN, FIVE],
          starterPoints: [[FIVE, FIFTEEN_TWO]],
        },
        {
          handPoints: 0,
          keep: [TEN, EIGHT],
          starterPoints: [
            [NINE, RUN],
            [SEVEN, FIFTEEN_TWO],
            [FIVE, FIFTEEN_TWO],
          ],
        },
        {
          handPoints: 0,
          keep: [TEN, TWO],
          starterPoints: [
            [FIVE, FIFTEEN_TWO],
            [THREE, FIFTEEN_TWO],
          ],
        },
      ]),
    );
  });

  it("five card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [TEN, THREE, JACK, FIVE, FOUR],
      buildExpectedPoints([
        {
          handPoints: 0,
          keep: [TEN, THREE, JACK],
          starterPoints: [
            ...queenNineFiveFifteenFourStarters,
            [TWO, FIFTEEN_FOUR],
          ],
        },
        {
          anyTenPoints: FIFTEEN_TWO,
          handPoints: FIFTEEN_TWO,
          keep: [TEN, THREE, FIVE],
          starterPoints: tenLikeThreeFiveStarters,
        },
        {
          handPoints: 0,
          keep: [TEN, THREE, FOUR],
          starterPoints: tenLikeThreeFourStarters,
        },
        {
          anyTenPoints: FIFTEEN_TWO,
          handPoints: FIFTEEN_FOUR,
          keep: [TEN, JACK, FIVE],
          starterPoints: queenNineFiveFifteenFourStarters,
        },
        /* jscpd:ignore-start: test data entry boundary */
        {
          handPoints: 0,
          keep: [TEN, JACK, FOUR],
          starterPoints: [
            ...queenNineFiveFifteenFourStarters,
            [ACE, FIFTEEN_FOUR],
          ],
        },
        /* jscpd:ignore-end */
        {
          anyTenPoints: FIFTEEN_TWO,
          handPoints: FIFTEEN_TWO,
          keep: [TEN, FIVE, FOUR],
          starterPoints: tenLikeFiveFourStarters,
        },
        {
          anyTenPoints: FIFTEEN_TWO,
          handPoints: FIFTEEN_TWO,
          keep: [THREE, JACK, FIVE],
          starterPoints: tenLikeThreeFiveStarters,
        },
        {
          handPoints: 0,
          keep: [THREE, JACK, FOUR],
          starterPoints: tenLikeThreeFourStarters,
        },
        {
          anyTenPoints: FIFTEEN_TWO,
          handPoints: RUN,
          keep: [THREE, FIVE, FOUR],
          starterPoints: [
            [EIGHT, FIFTEEN_TWO],
            [SEVEN, FIFTEEN_TWO],
            [SIX, FIFTEEN_TWO + RUN_POINTS_PER_CARD],
            [FIVE, RUN],
            [FOUR, RUN],
            [THREE, FIFTEEN_TWO + RUN],
            [TWO, RUN_POINTS_PER_CARD],
          ],
        },
        {
          anyTenPoints: FIFTEEN_TWO,
          handPoints: FIFTEEN_TWO,
          keep: [JACK, FIVE, FOUR],
          starterPoints: tenLikeFiveFourStarters,
        },
      ]),
    );
  });

  it("six card descending rank order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [KING, QUEEN, JACK, SIX, FIVE, FOUR],
      buildExpectedPoints([
        {
          handPoints: RUN,
          keep: [KING, QUEEN, JACK, SIX],
          starterPoints: [
            ...faceCardRunPrefix,
            [NINE, FIFTEEN_TWO],
            [FIVE, FIFTEEN_SIX],
          ],
        },
        {
          anyTenPoints: FIFTEEN_TWO,
          handPoints: FIFTEEN_SIX + RUN,
          keep: [KING, QUEEN, JACK, FIVE],
          starterPoints: [...faceCardRunPrefix, [FIVE, FIFTEEN_SIX]],
        },
        {
          handPoints: RUN,
          keep: [KING, QUEEN, JACK, FOUR],
          starterPoints: [
            ...faceCardRunPrefix,
            [FIVE, FIFTEEN_SIX],
            [ACE, FIFTEEN_SIX],
          ],
        },
        ...buildFaceCardGroupExpectations([
          { faceCards: [KING, QUEEN], prefix: [[JACK, RUN]] },
          { faceCards: [KING, JACK], prefix: [[QUEEN, RUN]] },
          {
            faceCards: [QUEEN, JACK],
            prefix: [
              [KING, RUN],
              [TEN, RUN],
            ],
          },
        ]),
        ...[KING, QUEEN, JACK].map(
          (faceCard): KeepExpectation => ({
            anyTenPoints: FIFTEEN_TWO,
            handPoints: FIFTEEN_FOUR + RUN,
            keep: [faceCard, SIX, FIVE, FOUR],
            starterPoints: faceCardSixFiveFourStarters,
          }),
        ),
      ]),
    );
  });
});
