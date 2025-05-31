import { describe, expect, it } from "@jest/globals";
import type { HandCard } from "../game/HandCard";
import { SortOrder } from "./SortOrder";
import { CARDS as card } from "../game/Card";
import { sortCards } from "./sortCards";

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
});
