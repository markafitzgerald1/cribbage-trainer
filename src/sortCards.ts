/* jscpd:ignore-start */
import { HandCard } from "./HandCard";
import { SortOrder } from "./SortOrder";
import { sortOrderNames } from "./SortOrderName";
/* jscpd:ignore-end */

const createCompare =
  (sortOrder: SortOrder) =>
  (first: HandCard, second: HandCard): number => {
    switch (sortOrder) {
      case SortOrder.DealOrder:
        return first.dealOrder - second.dealOrder;
      case SortOrder.Ascending:
        return first.rankValue - second.rankValue;
      case SortOrder.Descending:
      default:
        return second.rankValue - first.rankValue;
    }
  };

const compare = Object.fromEntries(
  sortOrderNames.map((key) => [key, createCompare(SortOrder[key])])
);

export const sortCards = <T extends HandCard>(
  dealtCards: readonly T[],
  sortOrder: SortOrder
) => [...dealtCards].sort(compare[SortOrder[sortOrder]]);
