import { Card, INDICES_PER_SUIT, CARDS as card } from "../game/Card";
// jscpd:ignore-start
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
// jscpd:ignore-end
import {
  ScoredKeepDiscard,
  allScoredKeepDiscardsByExpectedScoreDescending,
} from "./analysis";
import { describe, expect, it } from "@jest/globals";
import { HAND_POINTS } from "../game/handPoints";
import { SUITS_PER_DECK } from "../game/expectedHandPoints";
import { compareByExpectedScoreDescending } from "./compareByExpectedScoreDescending";
import { rankCounts } from "../game/rankCounts";

const { FIFTEEN_TWO, FIFTEEN_FOUR, FIFTEEN_SIX, PAIR } = HAND_POINTS;

const RUN_POINTS_PER_CARD = 1;
const RUN_LENGTH = 3;
const RUN = RUN_LENGTH * RUN_POINTS_PER_CARD;

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
        expectedHandPoints: [Card, number][];
        handPoints: number;
      };
    },
  ): void {
    const cardRankCounts = rankCounts(cards);
    const REMAINING_DECK_SIZE = CARDS_PER_DECK - cards.length;
    const expectedScoredKeepDiscards: ScoredKeepDiscard<Card>[] = [];
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
    expectedScoredKeepDiscards.sort(compareByExpectedScoreDescending);
    const actualScoredKeepDiscards = roundExpectedHandPoints(
      allScoredKeepDiscardsByExpectedScoreDescending(cards),
    );

    expect(actualScoredKeepDiscards).toStrictEqual(expectedScoredKeepDiscards);
  }

  it("two card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([ACE, TWO], {
      "": {
        expectedHandPoints: [],
        handPoints: 0,
      },
    });
  });

  const keepLabel = (...cards: Card[]): string =>
    cards.map((keepCard) => keepCard.rankLabel).join("-");

  it("three card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [JACK, FOUR, FIVE],
      {
        [keepLabel(JACK)]: {
          expectedHandPoints: [[FIVE, FIFTEEN_TWO]],
          handPoints: 0,
        },
        [keepLabel(FOUR)]: {
          expectedHandPoints: [],
          handPoints: 0,
        },
        [keepLabel(FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [],
          handPoints: 0,
        },
      },
    );
  });

  it("four card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [TEN, TWO, EIGHT, FIVE],
      {
        [keepLabel(EIGHT, FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [SEVEN, FIFTEEN_TWO],
            [TWO, FIFTEEN_TWO],
          ],
          handPoints: 0,
        },
        [keepLabel(TWO, FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [[EIGHT, FIFTEEN_TWO]],
          handPoints: 0,
        },
        [keepLabel(TWO, EIGHT)]: {
          expectedHandPoints: [
            [SEVEN, FIFTEEN_TWO],
            [FIVE, FIFTEEN_TWO],
          ],
          handPoints: 0,
        },
        [keepLabel(TEN, FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [[FIVE, FIFTEEN_TWO]],
          handPoints: FIFTEEN_TWO,
        },
        [keepLabel(TEN, EIGHT)]: {
          expectedHandPoints: [
            [NINE, RUN],
            [SEVEN, FIFTEEN_TWO],
            [FIVE, FIFTEEN_TWO],
          ],
          handPoints: 0,
        },
        [keepLabel(TEN, TWO)]: {
          expectedHandPoints: [
            [FIVE, FIFTEEN_TWO],
            [THREE, FIFTEEN_TWO],
          ],
          handPoints: 0,
        },
      },
    );
  });

  it("five card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [TEN, THREE, JACK, FIVE, FOUR],
      {
        [keepLabel(TEN, THREE, JACK)]: {
          expectedHandPoints: [
            [QUEEN, RUN],
            [NINE, RUN],
            [FIVE, FIFTEEN_FOUR],
            [TWO, FIFTEEN_FOUR],
          ],
          handPoints: 0,
        },
        [keepLabel(TEN, THREE, FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [SEVEN, FIFTEEN_TWO],
            [FIVE, FIFTEEN_TWO],
            [FOUR, RUN],
            [TWO, FIFTEEN_TWO],
          ],
          handPoints: FIFTEEN_TWO,
        },
        [keepLabel(TEN, THREE, FOUR)]: {
          expectedHandPoints: [
            [EIGHT, FIFTEEN_TWO],
            [FIVE, FIFTEEN_TWO + RUN],
            [TWO, FIFTEEN_TWO + RUN],
            [ACE, FIFTEEN_TWO],
          ],
          handPoints: 0,
        },
        [keepLabel(TEN, JACK, FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [QUEEN, RUN],
            [NINE, RUN],
            [FIVE, FIFTEEN_FOUR],
          ],
          handPoints: FIFTEEN_FOUR,
        },
        [keepLabel(TEN, JACK, FOUR)]: {
          expectedHandPoints: [
            [QUEEN, RUN],
            [NINE, RUN],
            [FIVE, FIFTEEN_FOUR],
            [ACE, FIFTEEN_FOUR],
          ],
          handPoints: 0,
        },
        [keepLabel(TEN, FIVE, FOUR)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_TWO],
            [THREE, RUN],
            [ACE, FIFTEEN_TWO],
          ],
          handPoints: FIFTEEN_TWO,
        },
        [keepLabel(THREE, JACK, FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [SEVEN, FIFTEEN_TWO],
            [FIVE, FIFTEEN_TWO],
            [FOUR, RUN],
            [TWO, FIFTEEN_TWO],
          ],
          handPoints: FIFTEEN_TWO,
        },
        [keepLabel(THREE, JACK, FOUR)]: {
          expectedHandPoints: [
            [EIGHT, FIFTEEN_TWO],
            [FIVE, FIFTEEN_TWO + RUN],
            [TWO, FIFTEEN_TWO + RUN],
            [ACE, FIFTEEN_TWO],
          ],
          handPoints: 0,
        },
        [keepLabel(THREE, FIVE, FOUR)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [EIGHT, FIFTEEN_TWO],
            [SEVEN, FIFTEEN_TWO],
            [SIX, FIFTEEN_TWO + RUN_POINTS_PER_CARD],
            [FIVE, RUN],
            [FOUR, RUN],
            [THREE, FIFTEEN_TWO + RUN],
            [TWO, RUN_POINTS_PER_CARD],
          ],
          handPoints: RUN,
        },
        [keepLabel(JACK, FIVE, FOUR)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_TWO],
            [THREE, RUN],
            [ACE, FIFTEEN_TWO],
          ],
          handPoints: FIFTEEN_TWO,
        },
      },
    );
  });

  it("six card descending rank order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [KING, QUEEN, JACK, SIX, FIVE, FOUR],
      {
        [keepLabel(KING, QUEEN, JACK, SIX)]: {
          expectedHandPoints: [
            [KING, RUN],
            [QUEEN, RUN],
            [JACK, RUN],
            [TEN, RUN_POINTS_PER_CARD],
            [NINE, FIFTEEN_TWO],
            [FIVE, FIFTEEN_SIX],
          ],
          handPoints: RUN,
        },
        [keepLabel(KING, QUEEN, JACK, FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [KING, RUN],
            [QUEEN, RUN],
            [JACK, RUN],
            [TEN, RUN_POINTS_PER_CARD],
            [FIVE, FIFTEEN_SIX],
          ],
          handPoints: FIFTEEN_SIX + RUN,
        },
        [keepLabel(KING, QUEEN, JACK, FOUR)]: {
          expectedHandPoints: [
            [KING, RUN],
            [QUEEN, RUN],
            [JACK, RUN],
            [TEN, RUN_POINTS_PER_CARD],
            [FIVE, FIFTEEN_SIX],
            [ACE, FIFTEEN_SIX],
          ],
          handPoints: RUN,
        },
        [keepLabel(KING, QUEEN, SIX, FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [JACK, RUN],
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN],
            [FIVE, FIFTEEN_FOUR],
            [FOUR, FIFTEEN_TWO + RUN],
          ],
          handPoints: FIFTEEN_FOUR,
        },
        [keepLabel(KING, QUEEN, SIX, FOUR)]: {
          expectedHandPoints: [
            [JACK, RUN],
            [NINE, FIFTEEN_TWO],
            [FIVE, FIFTEEN_SIX + RUN],
            [ACE, FIFTEEN_FOUR],
          ],
          handPoints: 0,
        },
        [keepLabel(KING, QUEEN, FIVE, FOUR)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [JACK, RUN],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR],
            [THREE, RUN],
            [ACE, FIFTEEN_FOUR],
          ],
          handPoints: FIFTEEN_FOUR,
        },
        [keepLabel(KING, JACK, SIX, FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [QUEEN, RUN],
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN],
            [FIVE, FIFTEEN_FOUR],
            [FOUR, FIFTEEN_TWO + RUN],
          ],
          handPoints: FIFTEEN_FOUR,
        },
        [keepLabel(KING, JACK, SIX, FOUR)]: {
          expectedHandPoints: [
            [QUEEN, RUN],
            [NINE, FIFTEEN_TWO],
            [FIVE, FIFTEEN_SIX + RUN],
            [ACE, FIFTEEN_FOUR],
          ],
          handPoints: 0,
        },
        [keepLabel(KING, JACK, FIVE, FOUR)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [QUEEN, RUN],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR],
            [THREE, RUN],
            [ACE, FIFTEEN_FOUR],
          ],
          handPoints: FIFTEEN_FOUR,
        },
        [keepLabel(QUEEN, JACK, SIX, FIVE)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [KING, RUN],
            [TEN, RUN],
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN],
            [FIVE, FIFTEEN_FOUR],
            [FOUR, FIFTEEN_TWO + RUN],
          ],
          handPoints: FIFTEEN_FOUR,
        },
        [keepLabel(QUEEN, JACK, SIX, FOUR)]: {
          expectedHandPoints: [
            [KING, RUN],
            [TEN, RUN],
            [NINE, FIFTEEN_TWO],
            [FIVE, FIFTEEN_SIX + RUN],
            [ACE, FIFTEEN_FOUR],
          ],
          handPoints: 0,
        },
        [keepLabel(QUEEN, JACK, FIVE, FOUR)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [KING, RUN],
            [TEN, RUN],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR],
            [THREE, RUN],
            [ACE, FIFTEEN_FOUR],
          ],
          handPoints: FIFTEEN_FOUR,
        },
        [keepLabel(KING, SIX, FIVE, FOUR)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN_POINTS_PER_CARD],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR + RUN],
            [FOUR, FIFTEEN_TWO + RUN],
            [THREE, RUN_POINTS_PER_CARD],
            [ACE, FIFTEEN_TWO],
          ],
          handPoints: FIFTEEN_FOUR + RUN,
        },
        [keepLabel(QUEEN, SIX, FIVE, FOUR)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN_POINTS_PER_CARD],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR + RUN],
            [FOUR, FIFTEEN_TWO + RUN],
            [THREE, RUN_POINTS_PER_CARD],
            [ACE, FIFTEEN_TWO],
          ],
          handPoints: FIFTEEN_FOUR + RUN,
        },
        [keepLabel(JACK, SIX, FIVE, FOUR)]: {
          expectedAnyTenPoints: FIFTEEN_TWO,
          expectedHandPoints: [
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN_POINTS_PER_CARD],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR + RUN],
            [FOUR, FIFTEEN_TWO + RUN],
            [THREE, RUN_POINTS_PER_CARD],
            [ACE, FIFTEEN_TWO],
          ],
          handPoints: FIFTEEN_FOUR + RUN,
        },
      },
    );
  });
});
