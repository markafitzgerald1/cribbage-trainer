import { Rank } from "../game/Card";
import { SortOrder } from "./SortOrder";
import { sortOrderNames } from "./SortOrderName";

export interface ComparableCard {
  dealOrder: number;
  rank: Rank;
}

const createCompare =
  (sortOrder: SortOrder) =>
  (first: ComparableCard, second: ComparableCard): number => {
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

export const sortCards = <T extends ComparableCard>(
  dealtCards: readonly T[],
  sortOrder: SortOrder,
  // eslint-disable-next-line security/detect-object-injection
) => [...dealtCards].sort(compare[SortOrder[sortOrder]]);
