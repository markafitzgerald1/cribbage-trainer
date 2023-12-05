import { HandCard } from "../game/HandCard";
import { SortOrder } from "./SortOrder";
import { sortOrderNames } from "./SortOrderName";

const createCompare =
  (sortOrder: SortOrder) =>
  (first: HandCard, second: HandCard): number => {
    switch (sortOrder) {
      case SortOrder.DealOrder:
        return first.dealOrder - second.dealOrder;
      case SortOrder.Ascending:
        return first.rank - second.rank;
      case SortOrder.Descending:
      default:
        return second.rank - first.rank;
    }
  };

const compare = Object.fromEntries(
  // eslint-disable-next-line security/detect-object-injection
  sortOrderNames.map((key) => [key, createCompare(SortOrder[key])]),
);

export const sortCards = <T extends HandCard>(
  dealtCards: readonly T[],
  sortOrder: SortOrder,
  // eslint-disable-next-line security/detect-object-injection
) => [...dealtCards].sort(compare[SortOrder[sortOrder]]);
