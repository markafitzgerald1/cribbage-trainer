import { Card, CARDS as c } from "./Card";
import {
  ScoredKeepDiscard,
  allScoredKeepDiscardsByScoreDescending,
} from "./analysis";
import { describe, expect, it } from "@jest/globals";
import { HAND_POINTS } from "./scoring";

const { FIFTEEN_TWO, FIFTEEN_FOUR, FIFTEEN_SIX } = HAND_POINTS;

const RUN = 3;

describe("allScoredKeepDiscardsByScoreDescending", () => {
  it("should return nothing for an empty deal", () => {
    expect(allScoredKeepDiscardsByScoreDescending([])).toStrictEqual([]);
  });

  it("should return nothing for a one-card deal", () => {
    expect(allScoredKeepDiscardsByScoreDescending([c.ACE])).toStrictEqual([]);
  });

  it("two card deal with duplicate cards throws", () => {
    const cards = [c.ACE, c.ACE];
    expect(() => allScoredKeepDiscardsByScoreDescending(cards)).toThrow(
      "Duplicate cards exist"
    );
  });

  function expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
    cards: readonly Card[],
    points: readonly number[]
  ): void {
    const scoreKeepDiscards: ScoredKeepDiscard<Card>[] = [];
    let pointsIndex = 0;
    for (let index1 = 0; index1 < cards.length; index1 += 1) {
      for (let index2 = index1 + 1; index2 < cards.length; index2 += 1) {
        scoreKeepDiscards.push({
          discard: [cards[index1]!, cards[index2]!],
          keep: cards.filter(
            (_, index) => index !== index1 && index !== index2
          ),
          points: points[pointsIndex]!,
        });
        pointsIndex += 1;
      }
    }
    scoreKeepDiscards.sort((card1, card2) => card2.points - card1.points);

    expect(allScoredKeepDiscardsByScoreDescending(cards)).toStrictEqual(
      scoreKeepDiscards
    );
  }

  it("two card deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [c.ACE, c.TWO],
      [0]
    );
  });

  it("three card deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [c.JACK, c.FOUR, c.FIVE],
      [0, 0, 0]
    );
  });

  it("four card random ranks deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [c.TEN, c.TWO, c.EIGHT, c.FIVE],
      [0, 0, 0, FIFTEEN_TWO, 0, 0]
    );
  });

  it("five card random ranks deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [c.TEN, c.THREE, c.JACK, c.FIVE, c.FOUR],
      [
        FIFTEEN_TWO,
        RUN,
        0,
        FIFTEEN_TWO,
        FIFTEEN_TWO,
        0,
        FIFTEEN_FOUR,
        0,
        FIFTEEN_TWO,
        0,
      ]
    );
  });

  it("six card descending ranks deal", () => {
    expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual(
      [c.KING, c.QUEEN, c.JACK, c.SIX, c.FIVE, c.FOUR],
      [
        FIFTEEN_FOUR + RUN,
        FIFTEEN_FOUR + RUN,
        FIFTEEN_FOUR,
        0,
        FIFTEEN_FOUR,
        FIFTEEN_FOUR + RUN,
        FIFTEEN_FOUR,
        0,
        FIFTEEN_FOUR,
        FIFTEEN_FOUR,
        0,
        FIFTEEN_FOUR,
        RUN,
        FIFTEEN_SIX + RUN,
        RUN,
      ]
    );
  });
});
