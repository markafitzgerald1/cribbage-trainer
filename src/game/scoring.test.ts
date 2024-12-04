import { CARD_LABELS, Card, CARDS as card } from "./Card";
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
  keep: readonly Card[],
  type: keyof HandPoints,
  expectedPoints: number,
) => expect(handPoints(keep)[type]).toBe(expectedPoints);

describe("handPoints", () => {
  const parseCards = (keepSpecifier: string): Card[] =>
    keepSpecifier.length === 0
      ? []
      : keepSpecifier
          .split(",")
          .map((rank) => card[CARD_LABELS.indexOf(rank)]!);

  describe("pairs", () => {
    const expectPairsPoints = (keep: readonly Card[], expectedPoints: number) =>
      expectTypePoints(keep, "pairs", expectedPoints);

    it("empty hand", () => {
      expectPairsPoints(parseCards(""), 0);
    });

    it("single card hand", () => {
      expectPairsPoints(parseCards("7"), 0);
    });

    describe("two card hand", () => {
      it("two equal rank cards", () => {
        expectPairsPoints(parseCards("Q,Q"), PAIR);
      });

      it("two unequal rank cards", () => {
        expectPairsPoints(parseCards("7,8"), 0);
      });

      it("same count unequal rank cards", () => {
        expectPairsPoints(parseCards("10,J"), 0);
      });
    });

    describe("three card hand", () => {
      it("three unequal rank cards", () => {
        expectPairsPoints(parseCards("2,3,K"), 0);
      });

      it("two equal rank cards", () => {
        expectPairsPoints(parseCards("4,8,4"), PAIR);
      });

      it("three equal rank cards", () => {
        expectPairsPoints(parseCards("6,6,6"), PAIRS_ROYALE);
      });
    });

    describe("four card hand", () => {
      it("four unequal rank cards", () => {
        expectPairsPoints(parseCards("8,A,J,4"), 0);
      });

      it("one pair", () => {
        expectPairsPoints(parseCards("5,2,9,5"), PAIR);
      });

      it("two distinct pairs", () => {
        const PAIR_COUNT = 2;
        expectPairsPoints(parseCards("Q,4,Q,4"), PAIR_COUNT * PAIR);
      });

      it("three of a kind", () => {
        expectPairsPoints(parseCards("8,8,10,8"), PAIRS_ROYALE);
      });

      it("four of a kind", () => {
        expectPairsPoints(parseCards("A,A,A,A"), DOUBLE_PAIRS_ROYALE);
      });
    });
  });

  describe("fifteens", () => {
    const expectFifteensPoints = (
      keep: readonly Card[],
      expectedPoints: number,
    ) => expectTypePoints(keep, "fifteens", expectedPoints);

    it("empty hand", () => {
      expectFifteensPoints(parseCards(""), 0);
    });

    it("single card hand", () => {
      expectFifteensPoints(parseCards("9"), 0);
    });

    describe("two card hand", () => {
      it("with equal card ranks", () => {
        expectFifteensPoints(parseCards("8,8"), 0);
      });

      it("with base one ranks that add up to 15", () => {
        expectFifteensPoints(parseCards("3,Q"), 0);
      });

      it("with counts that add up to 15", () => {
        expectFifteensPoints(parseCards("9,6"), FIFTEEN_TWO);
      });

      it("with counts but not ranks that add up to 15", () => {
        expectFifteensPoints(parseCards("5,K"), FIFTEEN_TWO);
      });
    });

    describe("three card hand", () => {
      it("with no fifteens", () => {
        expectFifteensPoints(parseCards("4,7,9"), 0);
      });

      it("with a two-card fifteen", () => {
        expectFifteensPoints(parseCards("7,8,A"), FIFTEEN_TWO);
      });

      it("with a three-card fifteen", () => {
        expectFifteensPoints(parseCards("4,Q,A"), FIFTEEN_TWO);
      });

      it("with two fifteens", () => {
        expectFifteensPoints(parseCards("6,9,6"), FIFTEEN_FOUR);
      });
    });

    describe("four card hand", () => {
      it("with no fifteens", () => {
        expectFifteensPoints(parseCards("2,4,6,8"), 0);
      });

      it("with one two-card fifteen", () => {
        expectFifteensPoints(parseCards("7,6,8,10"), FIFTEEN_TWO);
      });

      it("with one three-card fifteen", () => {
        expectFifteensPoints(parseCards("7,6,A,2"), FIFTEEN_TWO);
      });

      it("with one four-card fifteen", () => {
        expectFifteensPoints(parseCards("7,6,A,A"), FIFTEEN_TWO);
      });

      it("with two distinct fifteens", () => {
        expectFifteensPoints(parseCards("Q,5,9,6"), FIFTEEN_FOUR);
      });

      it("with two distinct overlapping two-card fifteens", () => {
        expectFifteensPoints(parseCards("K,5,5,4"), FIFTEEN_FOUR);
      });

      it("with two distinct overlapping three-card fifteens", () => {
        expectFifteensPoints(parseCards("Q,J,4,A"), FIFTEEN_FOUR);
      });

      it("with three distinct two-card fifteens", () => {
        expectFifteensPoints(parseCards("K,J,10,5"), FIFTEEN_SIX);
      });

      it("with three distinct three-card fifteens", () => {
        expectFifteensPoints(parseCards("7,4,4,4"), FIFTEEN_SIX);
      });

      it("with four distinct two-card fifteens", () => {
        expectFifteensPoints(parseCards("8,8,7,7"), FIFTEEN_EIGHT);
      });

      it("with four distinct three-card fifteens", () => {
        expectFifteensPoints(parseCards("J,5,5,5"), FIFTEEN_EIGHT);
      });

      it("with four fives", () => {
        expectFifteensPoints(parseCards("5,5,5,5"), FIFTEEN_EIGHT);
      });
    });
  });

  const RUN = 3;

  describe("runs", () => {
    const expectRunsPoints = (keep: readonly Card[], expectedPoints: number) =>
      expectTypePoints(keep, "runs", expectedPoints);

    it("empty hand", () => {
      expectRunsPoints([], 0);
    });

    it("single card hand", () => {
      expectRunsPoints([card.EIGHT], 0);
    });

    describe("two card hand", () => {
      it("two cards with adjacent ranks", () => {
        expectRunsPoints(parseCards("5,4"), 0);
      });

      it("two cards with non-adjacent ranks", () => {
        expectRunsPoints(parseCards("A,8"), 0);
      });
    });

    describe("three card hand", () => {
      it("with no adjacent ranked cards", () => {
        expectRunsPoints(parseCards("6,A,J"), 0);
      });

      it("with two adjacent ranked cards", () => {
        expectRunsPoints(parseCards("6,7,J"), 0);
      });

      it("with three adjacent ranked cards", () => {
        expectRunsPoints(parseCards("7,6,5"), RUN);
      });

      it("with three adjacent count but not rank cards", () => {
        expectRunsPoints(parseCards("8,9,J"), 0);
      });

      it("with three adjacent ascending ranked cards", () => {
        expectRunsPoints(parseCards("A,2,3"), RUN);
      });

      it("with three adjacent descending ranked cards", () => {
        expectRunsPoints(parseCards("K,Q,J"), RUN);
      });
    });

    const LONG_RUN = 4;

    describe("four card hand", () => {
      it("with no adjacent ranked cards", () => {
        expectRunsPoints(parseCards("2,5,9,K"), 0);
      });

      it("with two adjacent ranked cards", () => {
        expectRunsPoints(parseCards("2,5,6,K"), 0);
      });

      it("with three adjacent ranked cards", () => {
        expectRunsPoints(parseCards("4,5,6,K"), RUN);
      });

      it("with four adjacent ranked cards", () => {
        expectRunsPoints(parseCards("4,5,6,7"), LONG_RUN);
      });

      it("with two overlapping sets of three adjacent ranked cards", () => {
        const RUN_COUNT = 2;
        expectRunsPoints(parseCards("A,3,2,3"), RUN_COUNT * RUN);
      });
    });
  });

  describe("total", () => {
    const expectTotalPoints = (keep: readonly Card[], expectedPoints: number) =>
      expectTypePoints(keep, "total", expectedPoints);

    it("fifteen and a run", () => {
      expectTotalPoints(parseCards("8,9,7"), FIFTEEN_TWO + RUN);
    });

    it("fifteen and a pair", () => {
      expectTotalPoints(parseCards("7,4,4"), FIFTEEN_TWO + PAIR);
    });

    it("pair and two runs", () => {
      const expectedRunCount = 2;
      expectTotalPoints(parseCards("J,J,K,Q"), PAIR + expectedRunCount * RUN);
    });

    it("two fifteens, one pair and two runs", () => {
      const expectedRunCount = 2;
      expectTotalPoints(
        parseCards("6,7,8,8"),
        FIFTEEN_FOUR + PAIR + expectedRunCount * RUN,
      );
    });

    it("four fifteens and two pairs", () => {
      const expectedPairCount = 2;
      expectTotalPoints(
        parseCards("10,10,5,5"),
        FIFTEEN_EIGHT + expectedPairCount * PAIR,
      );
    });

    it("two fifteens and a pair", () => {
      expectTotalPoints(parseCards("Q,Q,3,2"), FIFTEEN_FOUR + PAIR);
    });
  });
});
