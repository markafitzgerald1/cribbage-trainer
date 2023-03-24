import { Card, CARDS as c } from "./Card";
import { describe, expect, it } from "@jest/globals";
import { fifteensPoints, pairsPoints, runsPoints } from "./Scoring";

const expectPoints = (
  keep: Card[],
  pointsFunction: (keep: Card[]) => number,
  expectedPoints: number
) => expect(pointsFunction(keep)).toBe(expectedPoints);

describe("pairsPoints", () => {
  const expectPairsPoints = (keep: Card[], expectedPoints: number) =>
    expectPoints(keep, pairsPoints, expectedPoints);

  it("empty hand", () => {
    expectPairsPoints([], 0);
  });

  it("single card hand", () => {
    expectPairsPoints([c.SEVEN], 0);
  });

  const PAIR_POINTS = 2;

  describe("two card hand", () => {
    it("two equal rank cards", () => {
      expectPairsPoints([c.QUEEN, c.QUEEN], PAIR_POINTS);
    });

    it("two unequal rank cards", () => {
      expectPairsPoints([c.SEVEN, c.EIGHT], 0);
    });

    it("same count unequal rank cards", () => {
      expectPairsPoints([c.TEN, c.JACK], 0);
    });
  });

  const PAIRS_ROYALE_POINTS = 6;

  describe("three card hand", () => {
    it("three unequal rank cards", () => {
      expectPairsPoints([c.TWO, c.THREE, c.KING], 0);
    });

    it("two equal rank cards", () => {
      expectPairsPoints([c.FOUR, c.EIGHT, c.FOUR], PAIR_POINTS);
    });

    it("three equal rank cards", () => {
      expectPairsPoints([c.SIX, c.SIX, c.SIX], PAIRS_ROYALE_POINTS);
    });
  });

  describe("four card hand", () => {
    const DOUBLE_PAIRS_ROYALE_POINTS = 12;

    it("four unequal rank cards", () => {
      expectPairsPoints([c.EIGHT, c.ACE, c.JACK, c.FOUR], 0);
    });

    it("one pair", () => {
      expectPairsPoints([c.FIVE, c.TWO, c.NINE, c.FIVE], PAIR_POINTS);
    });

    it("two distinct pairs", () => {
      const PAIR_COUNT = 2;
      expectPairsPoints(
        [c.QUEEN, c.FOUR, c.QUEEN, c.FOUR],
        PAIR_COUNT * PAIR_POINTS
      );
    });

    it("three of a kind", () => {
      expectPairsPoints(
        [c.EIGHT, c.EIGHT, c.TEN, c.EIGHT],
        PAIRS_ROYALE_POINTS
      );
    });

    it("four of a kind", () => {
      expectPairsPoints(
        [c.ACE, c.ACE, c.ACE, c.ACE],
        DOUBLE_PAIRS_ROYALE_POINTS
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

  const FIFTEEN_TWO_POINTS = 2;

  describe("two card hand", () => {
    it("with equal card ranks", () => {
      expectFifteensPoints([c.EIGHT, c.EIGHT], 0);
    });

    it("with base one ranks that add up to 15", () => {
      expectFifteensPoints([c.THREE, c.QUEEN], 0);
    });

    it("with counts that add up to 15", () => {
      expectFifteensPoints([c.NINE, c.SIX], FIFTEEN_TWO_POINTS);
    });

    it("with counts but not ranks that add up to 15", () => {
      expectFifteensPoints([c.FIVE, c.KING], FIFTEEN_TWO_POINTS);
    });
  });

  const FIFTEEN_FOUR_POINTS = 4;

  describe("three card hand", () => {
    it("with no fifteens", () => {
      expectFifteensPoints([c.FOUR, c.SEVEN, c.NINE], 0);
    });

    it("with a two-card fifteen", () => {
      expectFifteensPoints([c.SEVEN, c.EIGHT, c.ACE], FIFTEEN_TWO_POINTS);
    });

    it("with a three-card fifteen", () => {
      expectFifteensPoints([c.FOUR, c.QUEEN, c.ACE], FIFTEEN_TWO_POINTS);
    });

    it("with two fifteens", () => {
      expectFifteensPoints([c.SIX, c.NINE, c.SIX], FIFTEEN_FOUR_POINTS);
    });
  });

  describe("four card hand", () => {
    const FIFTEEN_SIX_POINTS = 6;
    const FIFTEEN_EIGHT_POINTS = 8;

    it("with no fifteens", () => {
      expectFifteensPoints([c.TWO, c.FOUR, c.SIX, c.EIGHT], 0);
    });

    it("with one two-card fifteen", () => {
      expectFifteensPoints(
        [c.SEVEN, c.SIX, c.EIGHT, c.TEN],
        FIFTEEN_TWO_POINTS
      );
    });

    it("with one three-card fifteen", () => {
      expectFifteensPoints([c.SEVEN, c.SIX, c.ACE, c.TWO], FIFTEEN_TWO_POINTS);
    });

    it("with one four-card fifteen", () => {
      expectFifteensPoints([c.SEVEN, c.SIX, c.ACE, c.ACE], FIFTEEN_TWO_POINTS);
    });

    it("with two distinct fifteens", () => {
      expectFifteensPoints(
        [c.QUEEN, c.FIVE, c.NINE, c.SIX],
        FIFTEEN_FOUR_POINTS
      );
    });

    it("with two distinct overlapping two-card fifteens", () => {
      expectFifteensPoints(
        [c.KING, c.FIVE, c.FIVE, c.FOUR],
        FIFTEEN_FOUR_POINTS
      );
    });

    it("with two distinct overlapping three-card fifteens", () => {
      expectFifteensPoints(
        [c.QUEEN, c.JACK, c.FOUR, c.ACE],
        FIFTEEN_FOUR_POINTS
      );
    });

    it("with three distinct two-card fifteens", () => {
      expectFifteensPoints([c.KING, c.TEN, c.JACK, c.FIVE], FIFTEEN_SIX_POINTS);
    });

    it("with three distinct three-card fifteens", () => {
      expectFifteensPoints(
        [c.SEVEN, c.FOUR, c.FOUR, c.FOUR],
        FIFTEEN_SIX_POINTS
      );
    });

    it("with four distinct two-card fifteens", () => {
      expectFifteensPoints(
        [c.EIGHT, c.EIGHT, c.SEVEN, c.SEVEN],
        FIFTEEN_EIGHT_POINTS
      );
    });

    it("with four distinct three-card fifteens", () => {
      expectFifteensPoints(
        [c.JACK, c.FIVE, c.FIVE, c.FIVE],
        FIFTEEN_EIGHT_POINTS
      );
    });

    it("with four fives", () => {
      expectFifteensPoints(
        [c.FIVE, c.FIVE, c.FIVE, c.FIVE],
        FIFTEEN_EIGHT_POINTS
      );
    });
  });
});

describe("runsPoints", () => {
  const expectRunsPoints = (keep: Card[], expectedPoints: number) =>
    expectPoints(keep, runsPoints, expectedPoints);

  it("empty hand", () => {
    expectRunsPoints([], 0);
  });

  it("single card hand", () => {
    expectRunsPoints([c.EIGHT], 0);
  });

  describe("two card hand", () => {
    it("two cards with adjacent ranks", () => {
      expectRunsPoints([c.FIVE, c.FOUR], 0);
    });

    it("two cards with non-adjacent ranks", () => {
      expectRunsPoints([c.ACE, c.EIGHT], 0);
    });
  });

  const THREE_RUN_POINTS = 3;

  describe("three card hand", () => {
    it("with no adjacent ranked cards", () => {
      expectRunsPoints([c.SIX, c.ACE, c.JACK], 0);
    });

    it("with two adjacent ranked cards", () => {
      expectRunsPoints([c.SIX, c.SEVEN, c.JACK], 0);
    });

    it("with three adjacent ranked cards", () => {
      expectRunsPoints([c.SIX, c.SEVEN, c.FIVE], THREE_RUN_POINTS);
    });

    it("with three adjacent count but not rank cards", () => {
      expectRunsPoints([c.EIGHT, c.NINE, c.JACK], 0);
    });

    it("with three adjacent ascending ranked cards", () => {
      expectRunsPoints([c.ACE, c.TWO, c.THREE], THREE_RUN_POINTS);
    });

    it("with three adjacent descending ranked cards", () => {
      expectRunsPoints([c.KING, c.QUEEN, c.JACK], THREE_RUN_POINTS);
    });
  });

  describe("four card hand", () => {
    const FOUR_RUN_POINTS = 4;

    it("with no adjacent ranked cards", () => {
      expectRunsPoints([c.TWO, c.FIVE, c.NINE, c.KING], 0);
    });

    it("with two adjacent ranked cards", () => {
      expectRunsPoints([c.TWO, c.FIVE, c.SIX, c.KING], 0);
    });

    it("with three adjacent ranked cards", () => {
      expectRunsPoints([c.FOUR, c.FIVE, c.SIX, c.KING], THREE_RUN_POINTS);
    });

    it("with four adjacent ranked cards", () => {
      expectRunsPoints([c.FOUR, c.FIVE, c.SIX, c.SEVEN], FOUR_RUN_POINTS);
    });

    it("with two overlapping sets of three adjacent ranked cards", () => {
      const RUN_COUNT = 2;
      expectRunsPoints(
        [c.ACE, c.THREE, c.TWO, c.THREE],
        RUN_COUNT * THREE_RUN_POINTS
      );
    });
  });
});
