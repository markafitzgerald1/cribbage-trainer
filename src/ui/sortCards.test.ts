import { Rank, CARDS as card } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import type { HandCard } from "../game/HandCard";
import { SortOrder } from "./SortOrder";
import { sortCards } from "./sortCards";
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const INVALID_SORT_ORDER = -1 as SortOrder;

describe("sortCards", () => {
  describe("hand", () => {
    const handCards: readonly HandCard[] = [
      card.KING,
      card.ACE,
      card.SEVEN,
      card.FOUR,
      card.QUEEN,
      card.NINE,
    ].map((handCard, index) => ({
      ...handCard,
      dealOrder: index,
    }));

    const expectSort = (sortOrder: SortOrder) => {
      expect(sortCards([...handCards], sortOrder)).toStrictEqual(
        [...handCards].sort((first, second) => {
          switch (sortOrder) {
            case SortOrder.Ascending:
              return first.rank - second.rank;
            case SortOrder.DealOrder:
              return first.dealOrder - second.dealOrder;
            case SortOrder.Descending:
            default:
              return second.rank - first.rank;
          }
        }),
      );
    };

    it("sorts ascending", () => {
      expectSort(SortOrder.Ascending);
    });

    it("sorts descending", () => {
      expectSort(SortOrder.Descending);
    });

    it("sorts in deal order", () => {
      expectSort(SortOrder.DealOrder);
    });
  });

  describe("edge cases and error handling", () => {
    it("returns empty array when input is empty", () => {
      expect(sortCards([], SortOrder.Ascending)).toStrictEqual([]);
    });

    it("returns the same array when input has one card", () => {
      const single = [{ dealOrder: 0, rank: Rank.ACE }];

      expect(sortCards(single, SortOrder.Ascending)).toStrictEqual(single);
    });

    it("throws for invalid sortOrder", () => {
      expect(() => sortCards([], INVALID_SORT_ORDER)).toThrow(
        "Invalid sortOrder: -1",
      );
    });
  });
});
