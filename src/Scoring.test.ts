import { CARDS_PER_PAIR, POINTS_PER_PAIR, pairsPoints } from "./Scoring";
import { Card, CARDS as c } from "./Card";
import { describe, expect, it } from "@jest/globals";
import { combination } from "js-combinatorics";

const expectPairsPoints = (keep: Card[], expectedPoints: number) =>
  expect(pairsPoints(keep)).toBe(expectedPoints);

const expectNoPairsPoints = (keep: Card[]) => expectPairsPoints(keep, 0);

const expectOnePairPoints = (keep: Card[]) =>
  expectPairsPoints(keep, POINTS_PER_PAIR);

const TWO_PAIRS_PAIR_COUNT = 2;
const expectTwoPairsPoints = (keep: Card[]) =>
  expectPairsPoints(keep, TWO_PAIRS_PAIR_COUNT * POINTS_PER_PAIR);

const PAIRS_ROYALE_CARD_COUNT = 3;
const PAIRS_ROYALE_PAIR_COUNT = Number(
  combination(PAIRS_ROYALE_CARD_COUNT, CARDS_PER_PAIR)
);
const expectPairsRoyalePoints = (keep: Card[]) =>
  expectPairsPoints(keep, PAIRS_ROYALE_PAIR_COUNT * POINTS_PER_PAIR);

const DOUBLE_PAIRS_ROYALE_CARD_COUNT = 4;
const DOUBLE_PAIRS_ROYALE_PAIR_COUNT = Number(
  combination(DOUBLE_PAIRS_ROYALE_CARD_COUNT, CARDS_PER_PAIR)
);
const expectDoublePairsRoyalePoints = (keep: Card[]) =>
  expectPairsPoints(keep, DOUBLE_PAIRS_ROYALE_PAIR_COUNT * POINTS_PER_PAIR);

describe("pairsPoints", () => {
  it("empty hand", () => {
    expectNoPairsPoints([]);
  });

  it("single card hand", () => {
    expectNoPairsPoints([c.SEVEN]);
  });

  describe("two card hand", () => {
    it("two equal rank cards", () => {
      expectOnePairPoints([c.QUEEN, c.QUEEN]);
    });

    it("two unequal rank cards", () => {
      expectNoPairsPoints([c.SEVEN, c.EIGHT]);
    });

    it("two same count unequal rank cards", () => {
      expectNoPairsPoints([c.TEN, c.JACK]);
    });
  });

  describe("three card hand", () => {
    it("three unequal rank cards", () => {
      expectNoPairsPoints([c.TWO, c.THREE, c.KING]);
    });

    it("three cards with two of equal rank", () => {
      expectOnePairPoints([c.FOUR, c.EIGHT, c.FOUR]);
    });

    it("three cards of equal rank", () => {
      expectPairsRoyalePoints([c.SIX, c.SIX, c.SIX]);
    });
  });

  describe("four card hand", () => {
    it("four unequal rank cards", () => {
      expectNoPairsPoints([c.EIGHT, c.ACE, c.JACK, c.FOUR]);
    });

    it("four cards with one pair", () => {
      expectOnePairPoints([c.FIVE, c.TWO, c.NINE, c.FIVE]);
    });

    it("four cards with two pairs", () => {
      expectTwoPairsPoints([c.QUEEN, c.FOUR, c.QUEEN, c.FOUR]);
    });

    it("four cards with three of a kind", () => {
      expectPairsRoyalePoints([c.EIGHT, c.EIGHT, c.TEN, c.EIGHT]);
    });

    it("four cards with four of a kind", () => {
      expectDoublePairsRoyalePoints([c.ACE, c.ACE, c.ACE, c.ACE]);
    });
  });
});
