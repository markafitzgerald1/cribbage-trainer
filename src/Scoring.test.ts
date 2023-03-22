import { Card, CARDS as c } from "./Card";
import { describe, expect, it } from "@jest/globals";
import { fifteensPoints, pairsPoints, HAND_POINTS as points } from "./Scoring";

const expectPoints = (
  keep: Card[],
  foo: (keep: Card[]) => number,
  expectedPoints: number
) => expect(foo(keep)).toBe(expectedPoints);

describe("pairsPoints", () => {
  const expectPairsPoints = (keep: Card[], expectedPoints: number) =>
    expectPoints(keep, pairsPoints, expectedPoints);

  it("empty hand", () => {
    expectPairsPoints([], 0);
  });

  it("single card hand", () => {
    expectPairsPoints([c.SEVEN], 0);
  });

  describe("two card hand", () => {
    it("two equal rank cards", () => {
      expectPairsPoints([c.QUEEN, c.QUEEN], points.PAIR);
    });

    it("two unequal rank cards", () => {
      expectPairsPoints([c.SEVEN, c.EIGHT], 0);
    });

    it("same count unequal rank cards", () => {
      expectPairsPoints([c.TEN, c.JACK], 0);
    });
  });

  describe("three card hand", () => {
    it("three unequal rank cards", () => {
      expectPairsPoints([c.TWO, c.THREE, c.KING], 0);
    });

    it("two equal rank cards", () => {
      expectPairsPoints([c.FOUR, c.EIGHT, c.FOUR], points.PAIR);
    });

    it("three equal rank cards", () => {
      expectPairsPoints([c.SIX, c.SIX, c.SIX], points.PAIRS_ROYALE);
    });
  });

  describe("four card hand", () => {
    it("four unequal rank cards", () => {
      expectPairsPoints([c.EIGHT, c.ACE, c.JACK, c.FOUR], 0);
    });

    it("one pair", () => {
      expectPairsPoints([c.FIVE, c.TWO, c.NINE, c.FIVE], points.PAIR);
    });

    it("two distinct pairs", () => {
      expectPairsPoints([c.QUEEN, c.FOUR, c.QUEEN, c.FOUR], points.TWO_PAIRS);
    });

    it("three of a kind", () => {
      expectPairsPoints(
        [c.EIGHT, c.EIGHT, c.TEN, c.EIGHT],
        points.PAIRS_ROYALE
      );
    });

    it("four of a kind", () => {
      expectPairsPoints(
        [c.ACE, c.ACE, c.ACE, c.ACE],
        points.DOUBLE_PAIRS_ROYALE
      );
    });
  });
});

describe("fifteensPoints", () => {
  const expectFifteensPoints = (keep: Card[], expectedPoints: number) =>
    expectPoints(keep, fifteensPoints, expectedPoints);

  it("empty hand", () => {
    expectFifteensPoints([], 0);
  });

  it("single card hand", () => {
    expectFifteensPoints([c.NINE], 0);
  });

  describe("two card hand", () => {
    it("with equal card ranks", () => {
      expectFifteensPoints([c.EIGHT, c.EIGHT], 0);
    });

    it("with base one ranks that add up to 15", () => {
      expectFifteensPoints([c.THREE, c.QUEEN], 0);
    });

    it("with counts that add up to 15", () => {
      expectFifteensPoints([c.NINE, c.SIX], points.FIFTEEN_TWO);
    });

    it("with counts but not ranks that add up to 15", () => {
      expectFifteensPoints([c.FIVE, c.KING], points.FIFTEEN_TWO);
    });
  });

  describe("three card hand", () => {
    it("with no fifteens", () => {
      expectFifteensPoints([c.FOUR, c.SEVEN, c.NINE], 0);
    });

    it("with a two-card fifteen", () => {
      expectFifteensPoints([c.SEVEN, c.EIGHT, c.ACE], points.FIFTEEN_TWO);
    });

    it("with a three-card fifteen", () => {
      expectFifteensPoints([c.FOUR, c.QUEEN, c.ACE], points.FIFTEEN_TWO);
    });

    it("with two fifteens", () => {
      expectFifteensPoints([c.SIX, c.NINE, c.SIX], points.FIFTEEN_FOUR);
    });
  });

  describe("four card hand", () => {
    it("with no fifteens", () => {
      expectFifteensPoints([c.TWO, c.FOUR, c.SIX, c.EIGHT], 0);
    });

    it("with one two-card fifteen", () => {
      expectFifteensPoints(
        [c.SEVEN, c.SIX, c.EIGHT, c.TEN],
        points.FIFTEEN_TWO
      );
    });

    it("with one three-card fifteen", () => {
      expectFifteensPoints([c.SEVEN, c.SIX, c.ACE, c.TWO], points.FIFTEEN_TWO);
    });

    it("with one four-card fifteen", () => {
      expectFifteensPoints([c.SEVEN, c.SIX, c.ACE, c.ACE], points.FIFTEEN_TWO);
    });

    it("with two distinct fifteens", () => {
      expectFifteensPoints(
        [c.QUEEN, c.FIVE, c.NINE, c.SIX],
        points.FIFTEEN_FOUR
      );
    });

    it("with two distinct overlapping two-card fifteens", () => {
      expectFifteensPoints(
        [c.KING, c.FIVE, c.FIVE, c.FOUR],
        points.FIFTEEN_FOUR
      );
    });

    it("with two distinct overlapping three-card fifteens", () => {
      expectFifteensPoints(
        [c.QUEEN, c.JACK, c.FOUR, c.ACE],
        points.FIFTEEN_FOUR
      );
    });

    it("with three distinct two-card fifteens", () => {
      expectFifteensPoints([c.KING, c.TEN, c.JACK, c.FIVE], points.FIFTEEN_SIX);
    });

    it("with three distinct three-card fifteens", () => {
      expectFifteensPoints(
        [c.SEVEN, c.FOUR, c.FOUR, c.FOUR],
        points.FIFTEEN_SIX
      );
    });

    it("with four distinct two-card fifteens", () => {
      expectFifteensPoints(
        [c.EIGHT, c.EIGHT, c.SEVEN, c.SEVEN],
        points.FIFTEEN_EIGHT
      );
    });

    it("with four distinct three-card fifteens", () => {
      expectFifteensPoints(
        [c.JACK, c.FIVE, c.FIVE, c.FIVE],
        points.FIFTEEN_EIGHT
      );
    });

    it("with four fives", () => {
      expectFifteensPoints(
        [c.FIVE, c.FIVE, c.FIVE, c.FIVE],
        points.FIFTEEN_EIGHT
      );
    });
  });
});
