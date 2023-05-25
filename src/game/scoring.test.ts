import { CARD_LABELS, Card, CARDS as c } from "./Card";
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
  expectedPoints: number
) => expect(handPoints(keep)[type]).toBe(expectedPoints);

describe("handPoints", () => {
  const parseCards = (keepSpecifier: string): Card[] =>
    keepSpecifier.split("").map((rank) => c[CARD_LABELS.indexOf(rank)]!);

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
        expectPairsPoints(parseCards("QQ"), PAIR);
      });

      it("two unequal rank cards", () => {
        expectPairsPoints(parseCards("78"), 0);
      });

      it("same count unequal rank cards", () => {
        expectPairsPoints(parseCards("TJ"), 0);
      });
    });

    describe("three card hand", () => {
      it("three unequal rank cards", () => {
        expectPairsPoints(parseCards("23K"), 0);
      });

      it("two equal rank cards", () => {
        expectPairsPoints(parseCards("484"), PAIR);
      });

      it("three equal rank cards", () => {
        expectPairsPoints(parseCards("666"), PAIRS_ROYALE);
      });
    });

    describe("four card hand", () => {
      it("four unequal rank cards", () => {
        expectPairsPoints(parseCards("8AJ4"), 0);
      });

      it("one pair", () => {
        expectPairsPoints(parseCards("5295"), PAIR);
      });

      it("two distinct pairs", () => {
        const PAIR_COUNT = 2;
        expectPairsPoints(parseCards("Q4Q4"), PAIR_COUNT * PAIR);
      });

      it("three of a kind", () => {
        expectPairsPoints(parseCards("88T8"), PAIRS_ROYALE);
      });

      it("four of a kind", () => {
        expectPairsPoints(parseCards("AAAA"), DOUBLE_PAIRS_ROYALE);
      });
    });
  });

  describe("fifteens", () => {
    const expectFifteensPoints = (
      keep: readonly Card[],
      expectedPoints: number
    ) => expectTypePoints(keep, "fifteens", expectedPoints);

    it("empty hand", () => {
      expectFifteensPoints(parseCards(""), 0);
    });

    it("single card hand", () => {
      expectFifteensPoints(parseCards("9"), 0);
    });

    describe("two card hand", () => {
      it("with equal card ranks", () => {
        expectFifteensPoints(parseCards("88"), 0);
      });

      it("with base one ranks that add up to 15", () => {
        expectFifteensPoints(parseCards("3Q"), 0);
      });

      it("with counts that add up to 15", () => {
        expectFifteensPoints(parseCards("96"), FIFTEEN_TWO);
      });

      it("with counts but not ranks that add up to 15", () => {
        expectFifteensPoints(parseCards("5K"), FIFTEEN_TWO);
      });
    });

    describe("three card hand", () => {
      it("with no fifteens", () => {
        expectFifteensPoints(parseCards("479"), 0);
      });

      it("with a two-card fifteen", () => {
        expectFifteensPoints(parseCards("78A"), FIFTEEN_TWO);
      });

      it("with a three-card fifteen", () => {
        expectFifteensPoints(parseCards("4QA"), FIFTEEN_TWO);
      });

      it("with two fifteens", () => {
        expectFifteensPoints(parseCards("696"), FIFTEEN_FOUR);
      });
    });

    describe("four card hand", () => {
      it("with no fifteens", () => {
        expectFifteensPoints(parseCards("2468"), 0);
      });

      it("with one two-card fifteen", () => {
        expectFifteensPoints(parseCards("768T"), FIFTEEN_TWO);
      });

      it("with one three-card fifteen", () => {
        expectFifteensPoints(parseCards("76A2"), FIFTEEN_TWO);
      });

      it("with one four-card fifteen", () => {
        expectFifteensPoints(parseCards("76AA"), FIFTEEN_TWO);
      });

      it("with two distinct fifteens", () => {
        expectFifteensPoints(parseCards("Q596"), FIFTEEN_FOUR);
      });

      it("with two distinct overlapping two-card fifteens", () => {
        expectFifteensPoints(parseCards("K554"), FIFTEEN_FOUR);
      });

      it("with two distinct overlapping three-card fifteens", () => {
        expectFifteensPoints(parseCards("QJ4A"), FIFTEEN_FOUR);
      });

      it("with three distinct two-card fifteens", () => {
        expectFifteensPoints(parseCards("KJT5"), FIFTEEN_SIX);
      });

      it("with three distinct three-card fifteens", () => {
        expectFifteensPoints(parseCards("7444"), FIFTEEN_SIX);
      });

      it("with four distinct two-card fifteens", () => {
        expectFifteensPoints(parseCards("8877"), FIFTEEN_EIGHT);
      });

      it("with four distinct three-card fifteens", () => {
        expectFifteensPoints(parseCards("J555"), FIFTEEN_EIGHT);
      });

      it("with four fives", () => {
        expectFifteensPoints(parseCards("5555"), FIFTEEN_EIGHT);
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
      expectRunsPoints([c.EIGHT], 0);
    });

    describe("two card hand", () => {
      it("two cards with adjacent ranks", () => {
        expectRunsPoints(parseCards("54"), 0);
      });

      it("two cards with non-adjacent ranks", () => {
        expectRunsPoints(parseCards("A8"), 0);
      });
    });

    describe("three card hand", () => {
      it("with no adjacent ranked cards", () => {
        expectRunsPoints(parseCards("6AJ"), 0);
      });

      it("with two adjacent ranked cards", () => {
        expectRunsPoints(parseCards("67J"), 0);
      });

      it("with three adjacent ranked cards", () => {
        expectRunsPoints(parseCards("765"), RUN);
      });

      it("with three adjacent count but not rank cards", () => {
        expectRunsPoints(parseCards("89J"), 0);
      });

      it("with three adjacent ascending ranked cards", () => {
        expectRunsPoints(parseCards("A23"), RUN);
      });

      it("with three adjacent descending ranked cards", () => {
        expectRunsPoints(parseCards("KQJ"), RUN);
      });
    });

    const LONG_RUN = 4;

    describe("four card hand", () => {
      it("with no adjacent ranked cards", () => {
        expectRunsPoints(parseCards("259K"), 0);
      });

      it("with two adjacent ranked cards", () => {
        expectRunsPoints(parseCards("256K"), 0);
      });

      it("with three adjacent ranked cards", () => {
        expectRunsPoints(parseCards("456K"), RUN);
      });

      it("with four adjacent ranked cards", () => {
        expectRunsPoints(parseCards("4567"), LONG_RUN);
      });

      it("with two overlapping sets of three adjacent ranked cards", () => {
        const RUN_COUNT = 2;
        expectRunsPoints(parseCards("A323"), RUN_COUNT * RUN);
      });
    });
  });

  describe("total", () => {
    const expectTotalPoints = (keep: readonly Card[], expectedPoints: number) =>
      expectTypePoints(keep, "total", expectedPoints);

    it("fifteen and a run", () => {
      expectTotalPoints(parseCards("897"), FIFTEEN_TWO + RUN);
    });

    it("fifteen and a pair", () => {
      expectTotalPoints(parseCards("744"), FIFTEEN_TWO + PAIR);
    });

    it("pair and two runs", () => {
      const expectedRunCount = 2;
      expectTotalPoints(parseCards("JJKQ"), PAIR + expectedRunCount * RUN);
    });

    it("two fifteens, one pair and two runs", () => {
      const expectedRunCount = 2;
      expectTotalPoints(
        parseCards("6788"),
        FIFTEEN_FOUR + PAIR + expectedRunCount * RUN
      );
    });

    it("four fifteens and two pairs", () => {
      const expectedPairCount = 2;
      expectTotalPoints(
        parseCards("TT55"),
        FIFTEEN_EIGHT + expectedPairCount * PAIR
      );
    });

    it("two fifteens and a pair", () => {
      expectTotalPoints(parseCards("QQ32"), FIFTEEN_FOUR + PAIR);
    });
  });
});
