import { DealtCard } from "./DealtCard";
import { SortOrder } from "./SortOrder";
import { SortOrderName } from "./SortOrderName";

const createCompare =
  (sortOrder: SortOrder) =>
  (first: DealtCard, second: DealtCard): number => {
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
  Object.keys(SortOrder)
    .filter((key) => isNaN(Number(key)))
    .map((key) => key as SortOrderName)
    .map((key) => [key, createCompare(SortOrder[key])])
);

export const sort = (dealtCards: DealtCard[], sortOrder: SortOrder) =>
  [...dealtCards].sort(compare[SortOrder[sortOrder]]);
