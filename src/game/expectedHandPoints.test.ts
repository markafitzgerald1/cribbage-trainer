import { INDICES_PER_SUIT, CARDS as card } from "./Card";
import { SUITS_PER_DECK, expectedHandPoints } from "./expectedHandPoints";
import { describe, expect, it } from "@jest/globals";
import { HAND_POINTS } from "../game/handPoints";
import { handPoints } from "./handPoints";
import { parseCards } from "./parseCards.common";
import { rankCounts } from "./rankCounts";

const { FIFTEEN_TWO, FIFTEEN_FOUR, FIFTEEN_EIGHT, PAIR, RUN_PER_CARD } =
  HAND_POINTS;

describe("expectedHandPoints", () => {
  describe("total", () => {
    interface ExpectedAddedPoints {
      starter: { [rankIndex: number]: number };
      anyTen?: number;
    }

    const expectTotalHandPoints = (
      {
        keepSpecifier,
        discardSpecifier,
      }: { keepSpecifier: string; discardSpecifier: string },
      expectedAddedPoints: ExpectedAddedPoints,
    ) => {
      const keep = parseCards(keepSpecifier);
      const discard = parseCards(discardSpecifier);
      const dealtCards = [...keep, ...discard];
      const starterCounts = rankCounts(dealtCards).map(
        (count) => SUITS_PER_DECK - count,
      );

      const totalStarterAddedPoints = Object.entries(
        expectedAddedPoints.starter,
      )
        .map(
          ([rankIndexString, points]) =>
            points * starterCounts[Number(rankIndexString)]!,
        )
        .reduce((previous, current) => previous + current, 0);
      const totalPairsAddedPoints = keep
        .map((keepCard) => starterCounts[keepCard.rank]! * PAIR)
        .reduce((sum, pairPoints) => sum + pairPoints, 0);
      const totalAnyTenAddedPoints =
        (expectedAddedPoints.anyTen ?? 0) *
        (starterCounts[card.TEN.rank]! +
          starterCounts[card.JACK.rank]! +
          starterCounts[card.QUEEN.rank]! +
          starterCounts[card.KING.rank]!);
      const expectedStartersAddedPoints =
        (totalStarterAddedPoints +
          totalPairsAddedPoints +
          totalAnyTenAddedPoints) /
        (INDICES_PER_SUIT * SUITS_PER_DECK - keep.length - discard.length);
      const preStarterPoints = handPoints(keep).total;

      expect(expectedHandPoints(keep, discard).total).toBe(
        preStarterPoints + expectedStartersAddedPoints,
      );
    };

    it("keep A,A,A,A; discard 2,3", () => {
      const keepSpecifier = "A,A,A,A";
      expectTotalHandPoints(
        { discardSpecifier: "2,3", keepSpecifier },
        {
          starter: {
            [card.ACE.rank]:
              parseCards(keepSpecifier).filter(
                (keptCard) => keptCard === card.ACE,
              ).length * PAIR,
          },
        },
      );
    });

    const KK41_EXPECTED_ADDED_POINTS: ExpectedAddedPoints = {
      anyTen: FIFTEEN_TWO,
      starter: {
        [card.ACE.rank]: FIFTEEN_FOUR,
        [card.FOUR.rank]: FIFTEEN_FOUR,
        [card.FIVE.rank]: FIFTEEN_FOUR,
      },
    };
    const KK4A_KEEP = "K,K,4,A";

    it("keep K,K,4,A; discard 7,9", () => {
      expectTotalHandPoints(
        { discardSpecifier: "7,9", keepSpecifier: KK4A_KEEP },
        KK41_EXPECTED_ADDED_POINTS,
      );
    });

    it("keep K,K,4,A; discard 4,A", () => {
      expectTotalHandPoints(
        { discardSpecifier: "4,A", keepSpecifier: KK4A_KEEP },
        KK41_EXPECTED_ADDED_POINTS,
      );
    });

    it("keep 10,10,10,10; discard J,J", () => {
      expectTotalHandPoints(
        { discardSpecifier: "J,J", keepSpecifier: "10,10,10,10" },
        {
          starter: {
            [card.FIVE.rank]: FIFTEEN_EIGHT,
          },
        },
      );
    });

    const RUN_LENGTH = 3;
    const RUN = RUN_LENGTH * RUN_PER_CARD;

    it("keep K,Q,3,A; discard 9,7", () => {
      expectTotalHandPoints(
        { discardSpecifier: "9,7", keepSpecifier: "K,Q,3,A" },
        {
          starter: {
            [card.ACE.rank]: FIFTEEN_FOUR,
            [card.TWO.rank]: FIFTEEN_FOUR + RUN,
            [card.FOUR.rank]: FIFTEEN_FOUR,
            [card.FIVE.rank]: FIFTEEN_FOUR,
            [card.JACK.rank]: RUN,
          },
        },
      );
    });

    const DOUBLE_LONG_RUN_LENGTH = 5;
    const DOUBLE_LONG_RUN = DOUBLE_LONG_RUN_LENGTH * RUN_PER_CARD;

    it("keep 6,4,3,2; discard 8,6", () => {
      expectTotalHandPoints(
        { discardSpecifier: "8,6", keepSpecifier: "6,4,3,2" },
        {
          anyTen: FIFTEEN_TWO,
          starter: {
            [card.ACE.rank]: RUN_PER_CARD,
            [card.TWO.rank]: FIFTEEN_TWO + RUN,
            [card.THREE.rank]: FIFTEEN_TWO + RUN,
            [card.FOUR.rank]: FIFTEEN_TWO + RUN,
            [card.FIVE.rank]: FIFTEEN_TWO + DOUBLE_LONG_RUN - RUN,
            [card.SIX.rank]: FIFTEEN_FOUR,
            [card.SEVEN.rank]: FIFTEEN_TWO,
            [card.EIGHT.rank]: FIFTEEN_TWO,
            [card.NINE.rank]: FIFTEEN_FOUR,
          },
        },
      );
    });

    it("keep 6; discard 7,8", () => {
      expectTotalHandPoints(
        { discardSpecifier: "7,8", keepSpecifier: "6" },
        {
          starter: {
            [card.NINE.rank]: FIFTEEN_TWO,
          },
        },
      );
    });
  });
});
