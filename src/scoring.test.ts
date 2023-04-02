import { Card, CARDS as c } from "./Card";
import { HAND_POINTS, HandPoints, handPoints } from "./scoring";
import { describe, expect, it } from "@jest/globals";

const {
  PAIR,
  PAIRS_ROYALE,
  DOUBLE_PAIRS_ROYALE,
  FIFTEEN_TWO,
  FIFTEEN_FOUR,
  FIFTEEN_SIX,
  FIFTEEN_EIGHT,
} = HAND_POINTS;

const expectTypePoints = (
  keep: Card[],
  type: keyof HandPoints,
  expectedPoints: number
) => expect(handPoints(keep)[type]).toBe(expectedPoints);

describe("handPoints", () => {
  describe("pairs", () => {
    const expectPairsPoints = (keep: Card[], expectedPoints: number) =>
      expectTypePoints(keep, "pairs", expectedPoints);

    it("empty hand", () => {
      expectPairsPoints([], 0);
    });

    it("single card hand", () => {
      expectPairsPoints([c.SEVEN], 0);
    });

    describe("two card hand", () => {
      it("two equal rank cards", () => {
        expectPairsPoints([c.QUEEN, c.QUEEN], PAIR);
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
        expectPairsPoints([c.FOUR, c.EIGHT, c.FOUR], PAIR);
      });

      it("three equal rank cards", () => {
        expectPairsPoints([c.SIX, c.SIX, c.SIX], PAIRS_ROYALE);
      });
    });

    describe("four card hand", () => {
      it("four unequal rank cards", () => {
        expectPairsPoints([c.EIGHT, c.ACE, c.JACK, c.FOUR], 0);
      });

      it("one pair", () => {
        expectPairsPoints([c.FIVE, c.TWO, c.NINE, c.FIVE], PAIR);
      });

      it("two distinct pairs", () => {
        const PAIR_COUNT = 2;
        expectPairsPoints(
          [c.QUEEN, c.FOUR, c.QUEEN, c.FOUR],
          PAIR_COUNT * PAIR
        );
      });

      it("three of a kind", () => {
        expectPairsPoints([c.EIGHT, c.EIGHT, c.TEN, c.EIGHT], PAIRS_ROYALE);
      });

      it("four of a kind", () => {
        expectPairsPoints([c.ACE, c.ACE, c.ACE, c.ACE], DOUBLE_PAIRS_ROYALE);
      });
    });
  });

  describe("fifteens", () => {
    const expectFifteensPoints = (keep: Card[], expectedPoints: number) =>
      expectTypePoints(keep, "fifteens", expectedPoints);

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
        expectFifteensPoints([c.NINE, c.SIX], FIFTEEN_TWO);
      });

      it("with counts but not ranks that add up to 15", () => {
        expectFifteensPoints([c.FIVE, c.KING], FIFTEEN_TWO);
      });
    });

    describe("three card hand", () => {
      it("with no fifteens", () => {
        expectFifteensPoints([c.FOUR, c.SEVEN, c.NINE], 0);
      });

      it("with a two-card fifteen", () => {
        expectFifteensPoints([c.SEVEN, c.EIGHT, c.ACE], FIFTEEN_TWO);
      });

      it("with a three-card fifteen", () => {
        expectFifteensPoints([c.FOUR, c.QUEEN, c.ACE], FIFTEEN_TWO);
      });

      it("with two fifteens", () => {
        expectFifteensPoints([c.SIX, c.NINE, c.SIX], FIFTEEN_FOUR);
      });
    });

    describe("four card hand", () => {
      it("with no fifteens", () => {
        expectFifteensPoints([c.TWO, c.FOUR, c.SIX, c.EIGHT], 0);
      });

      it("with one two-card fifteen", () => {
        expectFifteensPoints([c.SEVEN, c.SIX, c.EIGHT, c.TEN], FIFTEEN_TWO);
      });

      it("with one three-card fifteen", () => {
        expectFifteensPoints([c.SEVEN, c.SIX, c.ACE, c.TWO], FIFTEEN_TWO);
      });

      it("with one four-card fifteen", () => {
        expectFifteensPoints([c.SEVEN, c.SIX, c.ACE, c.ACE], FIFTEEN_TWO);
      });

      it("with two distinct fifteens", () => {
        expectFifteensPoints([c.QUEEN, c.FIVE, c.NINE, c.SIX], FIFTEEN_FOUR);
      });

      it("with two distinct overlapping two-card fifteens", () => {
        expectFifteensPoints([c.KING, c.FIVE, c.FIVE, c.FOUR], FIFTEEN_FOUR);
      });

      it("with two distinct overlapping three-card fifteens", () => {
        expectFifteensPoints([c.QUEEN, c.JACK, c.FOUR, c.ACE], FIFTEEN_FOUR);
      });

      it("with three distinct two-card fifteens", () => {
        expectFifteensPoints([c.KING, c.TEN, c.JACK, c.FIVE], FIFTEEN_SIX);
      });

      it("with three distinct three-card fifteens", () => {
        expectFifteensPoints([c.SEVEN, c.FOUR, c.FOUR, c.FOUR], FIFTEEN_SIX);
      });

      it("with four distinct two-card fifteens", () => {
        expectFifteensPoints(
          [c.EIGHT, c.EIGHT, c.SEVEN, c.SEVEN],
          FIFTEEN_EIGHT
        );
      });

      it("with four distinct three-card fifteens", () => {
        expectFifteensPoints([c.JACK, c.FIVE, c.FIVE, c.FIVE], FIFTEEN_EIGHT);
      });

      it("with four fives", () => {
        expectFifteensPoints([c.FIVE, c.FIVE, c.FIVE, c.FIVE], FIFTEEN_EIGHT);
      });
    });
  });

  const RUN = 3;

  describe("runs", () => {
    const expectRunsPoints = (keep: Card[], expectedPoints: number) =>
      expectTypePoints(keep, "runs", expectedPoints);

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

    describe("three card hand", () => {
      it("with no adjacent ranked cards", () => {
        expectRunsPoints([c.SIX, c.ACE, c.JACK], 0);
      });

      it("with two adjacent ranked cards", () => {
        expectRunsPoints([c.SIX, c.SEVEN, c.JACK], 0);
      });

      it("with three adjacent ranked cards", () => {
        expectRunsPoints([c.SIX, c.SEVEN, c.FIVE], RUN);
      });

      it("with three adjacent count but not rank cards", () => {
        expectRunsPoints([c.EIGHT, c.NINE, c.JACK], 0);
      });

      it("with three adjacent ascending ranked cards", () => {
        expectRunsPoints([c.ACE, c.TWO, c.THREE], RUN);
      });

      it("with three adjacent descending ranked cards", () => {
        expectRunsPoints([c.KING, c.QUEEN, c.JACK], RUN);
      });
    });

    const LONG_RUN = 4;

    describe("four card hand", () => {
      it("with no adjacent ranked cards", () => {
        expectRunsPoints([c.TWO, c.FIVE, c.NINE, c.KING], 0);
      });

      it("with two adjacent ranked cards", () => {
        expectRunsPoints([c.TWO, c.FIVE, c.SIX, c.KING], 0);
      });

      it("with three adjacent ranked cards", () => {
        expectRunsPoints([c.FOUR, c.FIVE, c.SIX, c.KING], RUN);
      });

      it("with four adjacent ranked cards", () => {
        expectRunsPoints([c.FOUR, c.FIVE, c.SIX, c.SEVEN], LONG_RUN);
      });

      it("with two overlapping sets of three adjacent ranked cards", () => {
        const RUN_COUNT = 2;
        expectRunsPoints([c.ACE, c.THREE, c.TWO, c.THREE], RUN_COUNT * RUN);
      });
    });
  });

  describe("total", () => {
    const expectTotalPoints = (keep: Card[], expectedPoints: number) =>
      expectTypePoints(keep, "total", expectedPoints);

    it("fifteen and a run", () => {
      expectTotalPoints([c.EIGHT, c.NINE, c.SEVEN], FIFTEEN_TWO + RUN);
    });

    it("fifteen and a pair", () => {
      expectTotalPoints([c.SEVEN, c.FOUR, c.FOUR], FIFTEEN_TWO + PAIR);
    });

    it("pair and two runs", () => {
      const expectedRunCount = 2;
      expectTotalPoints(
        [c.JACK, c.JACK, c.KING, c.QUEEN],
        PAIR + expectedRunCount * RUN
      );
    });

    it("two fifteens, one pair and two runs", () => {
      const expectedRunCount = 2;
      expectTotalPoints(
        [c.SIX, c.SEVEN, c.EIGHT, c.EIGHT],
        FIFTEEN_FOUR + PAIR + expectedRunCount * RUN
      );
    });

    it("four fifteens and two pairs", () => {
      const expectedPairCount = 2;
      expectTotalPoints(
        [c.TEN, c.TEN, c.FIVE, c.FIVE],
        FIFTEEN_EIGHT + expectedPairCount * PAIR
      );
    });

    it("two fifteens and a pair", () => {
      expectTotalPoints(
        [c.QUEEN, c.QUEEN, c.THREE, c.TWO],
        FIFTEEN_FOUR + PAIR
      );
    });
  });
});
