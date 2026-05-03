import { type Card, INDICES_PER_SUIT, CARDS as card } from "../game/Card";
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
import { SUITS_PER_DECK } from "../game/expectedHandPoints";
import { compareByExpectedScoreThenRankDescending } from "./compareByExpectedScoreDescending";
import { rankCounts } from "../game/rankCounts";

const { FIFTEEN_TWO, FIFTEEN_FOUR, FIFTEEN_SIX, PAIR } = HAND_POINTS;
const RUN_POINTS_PER_CARD = 1;
const RUN_LENGTH = 3;
const RUN = RUN_LENGTH * RUN_POINTS_PER_CARD;

function expectedPointsMap(
  handPoints: number,
  expectedHandPoints: [Card, number][] = [],
  expectedAnyTenPoints?: number,
) {
  const result: {
    handPoints: number;
    expectedHandPoints: [Card, number][];
    expectedAnyTenPoints?: number;
  } = { expectedHandPoints, handPoints };
  if (typeof expectedAnyTenPoints !== "undefined") {
    result.expectedAnyTenPoints = expectedAnyTenPoints;
  }
  return result;
}

/* jscpd:ignore-start */
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
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual([ACE, TWO], {
      "": expectedPointsMap(0, []),
    });
  });

  const keepLabel = (...cards: Card[]): string =>
    cards.map((keepCard) => keepCard.rankLabel).join("-");

  it("three card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [JACK, FOUR, FIVE],
      {
        [keepLabel(JACK)]: expectedPointsMap(0, [[FIVE, FIFTEEN_TWO]]),
        [keepLabel(FOUR)]: expectedPointsMap(0, []),
        [keepLabel(FIVE)]: expectedPointsMap(0, [], FIFTEEN_TWO),
      },
    );
  });

  it("four card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [TEN, TWO, EIGHT, FIVE],
      {
        [keepLabel(EIGHT, FIVE)]: expectedPointsMap(
          0,
          [
            [SEVEN, FIFTEEN_TWO],
            [TWO, FIFTEEN_TWO],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(TWO, FIVE)]: expectedPointsMap(
          0,
          [[EIGHT, FIFTEEN_TWO]],
          FIFTEEN_TWO,
        ),
        [keepLabel(TWO, EIGHT)]: expectedPointsMap(0, [
          [SEVEN, FIFTEEN_TWO],
          [FIVE, FIFTEEN_TWO],
        ]),
        [keepLabel(TEN, FIVE)]: expectedPointsMap(
          FIFTEEN_TWO,
          [[FIVE, FIFTEEN_TWO]],
          FIFTEEN_TWO,
        ),
        [keepLabel(TEN, EIGHT)]: expectedPointsMap(0, [
          [NINE, RUN],
          [SEVEN, FIFTEEN_TWO],
          [FIVE, FIFTEEN_TWO],
        ]),
        [keepLabel(TEN, TWO)]: expectedPointsMap(0, [
          [FIVE, FIFTEEN_TWO],
          [THREE, FIFTEEN_TWO],
        ]),
      },
    );
  });

  it("five card deal order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [TEN, THREE, JACK, FIVE, FOUR],
      {
        [keepLabel(TEN, THREE, JACK)]: expectedPointsMap(0, [
          [QUEEN, RUN],
          [NINE, RUN],
          [FIVE, FIFTEEN_FOUR],
          [TWO, FIFTEEN_FOUR],
        ]),
        [keepLabel(TEN, THREE, FIVE)]: expectedPointsMap(
          FIFTEEN_TWO,
          [
            [SEVEN, FIFTEEN_TWO],
            [FIVE, FIFTEEN_TWO],
            [FOUR, RUN],
            [TWO, FIFTEEN_TWO],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(TEN, THREE, FOUR)]: expectedPointsMap(0, [
          [EIGHT, FIFTEEN_TWO],
          [FIVE, FIFTEEN_TWO + RUN],
          [TWO, FIFTEEN_TWO + RUN],
          [ACE, FIFTEEN_TWO],
        ]),
        [keepLabel(TEN, JACK, FIVE)]: expectedPointsMap(
          FIFTEEN_FOUR,
          [
            [QUEEN, RUN],
            [NINE, RUN],
            [FIVE, FIFTEEN_FOUR],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(TEN, JACK, FOUR)]: expectedPointsMap(0, [
          [QUEEN, RUN],
          [NINE, RUN],
          [FIVE, FIFTEEN_FOUR],
          [ACE, FIFTEEN_FOUR],
        ]),
        [keepLabel(TEN, FIVE, FOUR)]: expectedPointsMap(
          FIFTEEN_TWO,
          [
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_TWO],
            [THREE, RUN],
            [ACE, FIFTEEN_TWO],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(THREE, JACK, FIVE)]: expectedPointsMap(
          FIFTEEN_TWO,
          [
            [SEVEN, FIFTEEN_TWO],
            [FIVE, FIFTEEN_TWO],
            [FOUR, RUN],
            [TWO, FIFTEEN_TWO],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(THREE, JACK, FOUR)]: expectedPointsMap(0, [
          [EIGHT, FIFTEEN_TWO],
          [FIVE, FIFTEEN_TWO + RUN],
          [TWO, FIFTEEN_TWO + RUN],
          [ACE, FIFTEEN_TWO],
        ]),
        [keepLabel(THREE, FIVE, FOUR)]: expectedPointsMap(
          RUN,
          [
            [EIGHT, FIFTEEN_TWO],
            [SEVEN, FIFTEEN_TWO],
            [SIX, FIFTEEN_TWO + RUN_POINTS_PER_CARD],
            [FIVE, RUN],
            [FOUR, RUN],
            [THREE, FIFTEEN_TWO + RUN],
            [TWO, RUN_POINTS_PER_CARD],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(JACK, FIVE, FOUR)]: expectedPointsMap(
          FIFTEEN_TWO,
          [
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_TWO],
            [THREE, RUN],
            [ACE, FIFTEEN_TWO],
          ],
          FIFTEEN_TWO,
        ),
      },
    );
  });

  it("six card descending rank order deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [KING, QUEEN, JACK, SIX, FIVE, FOUR],
      {
        [keepLabel(KING, QUEEN, JACK, SIX)]: expectedPointsMap(RUN, [
          [KING, RUN],
          [QUEEN, RUN],
          [JACK, RUN],
          [TEN, RUN_POINTS_PER_CARD],
          [NINE, FIFTEEN_TWO],
          [FIVE, FIFTEEN_SIX],
        ]),
        [keepLabel(KING, QUEEN, JACK, FIVE)]: expectedPointsMap(
          FIFTEEN_SIX + RUN,
          [
            [KING, RUN],
            [QUEEN, RUN],
            [JACK, RUN],
            [TEN, RUN_POINTS_PER_CARD],
            [FIVE, FIFTEEN_SIX],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(KING, QUEEN, JACK, FOUR)]: expectedPointsMap(RUN, [
          [KING, RUN],
          [QUEEN, RUN],
          [JACK, RUN],
          [TEN, RUN_POINTS_PER_CARD],
          [FIVE, FIFTEEN_SIX],
          [ACE, FIFTEEN_SIX],
        ]),
        [keepLabel(KING, QUEEN, SIX, FIVE)]: expectedPointsMap(
          FIFTEEN_FOUR,
          [
            [JACK, RUN],
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN],
            [FIVE, FIFTEEN_FOUR],
            [FOUR, FIFTEEN_TWO + RUN],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(KING, QUEEN, SIX, FOUR)]: expectedPointsMap(0, [
          [JACK, RUN],
          [NINE, FIFTEEN_TWO],
          [FIVE, FIFTEEN_SIX + RUN],
          [ACE, FIFTEEN_FOUR],
        ]),
        [keepLabel(KING, QUEEN, FIVE, FOUR)]: expectedPointsMap(
          FIFTEEN_FOUR,
          [
            [JACK, RUN],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR],
            [THREE, RUN],
            [ACE, FIFTEEN_FOUR],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(KING, JACK, SIX, FIVE)]: expectedPointsMap(
          FIFTEEN_FOUR,
          [
            [QUEEN, RUN],
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN],
            [FIVE, FIFTEEN_FOUR],
            [FOUR, FIFTEEN_TWO + RUN],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(KING, JACK, SIX, FOUR)]: expectedPointsMap(0, [
          [QUEEN, RUN],
          [NINE, FIFTEEN_TWO],
          [FIVE, FIFTEEN_SIX + RUN],
          [ACE, FIFTEEN_FOUR],
        ]),
        [keepLabel(KING, JACK, FIVE, FOUR)]: expectedPointsMap(
          FIFTEEN_FOUR,
          [
            [QUEEN, RUN],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR],
            [THREE, RUN],
            [ACE, FIFTEEN_FOUR],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(QUEEN, JACK, SIX, FIVE)]: expectedPointsMap(
          FIFTEEN_FOUR,
          [
            [KING, RUN],
            [TEN, RUN],
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN],
            [FIVE, FIFTEEN_FOUR],
            [FOUR, FIFTEEN_TWO + RUN],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(QUEEN, JACK, SIX, FOUR)]: expectedPointsMap(0, [
          [KING, RUN],
          [TEN, RUN],
          [NINE, FIFTEEN_TWO],
          [FIVE, FIFTEEN_SIX + RUN],
          [ACE, FIFTEEN_FOUR],
        ]),
        [keepLabel(QUEEN, JACK, FIVE, FOUR)]: expectedPointsMap(
          FIFTEEN_FOUR,
          [
            [KING, RUN],
            [TEN, RUN],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR],
            [THREE, RUN],
            [ACE, FIFTEEN_FOUR],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(KING, SIX, FIVE, FOUR)]: expectedPointsMap(
          FIFTEEN_FOUR + RUN,
          [
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN_POINTS_PER_CARD],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR + RUN],
            [FOUR, FIFTEEN_TWO + RUN],
            [THREE, RUN_POINTS_PER_CARD],
            [ACE, FIFTEEN_TWO],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(QUEEN, SIX, FIVE, FOUR)]: expectedPointsMap(
          FIFTEEN_FOUR + RUN,
          [
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN_POINTS_PER_CARD],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR + RUN],
            [FOUR, FIFTEEN_TWO + RUN],
            [THREE, RUN_POINTS_PER_CARD],
            [ACE, FIFTEEN_TWO],
          ],
          FIFTEEN_TWO,
        ),
        [keepLabel(JACK, SIX, FIVE, FOUR)]: expectedPointsMap(
          FIFTEEN_FOUR + RUN,
          [
            [NINE, FIFTEEN_TWO],
            [SEVEN, RUN_POINTS_PER_CARD],
            [SIX, FIFTEEN_TWO + RUN],
            [FIVE, FIFTEEN_FOUR + RUN],
            [FOUR, FIFTEEN_TWO + RUN],
            [THREE, RUN_POINTS_PER_CARD],
            [ACE, FIFTEEN_TWO],
          ],
          FIFTEEN_TWO,
        ),
      },
    );
  });
});
/* jscpd:ignore-end */
