import { Rank, Suit } from "../game/Card";
import { SORT_ORDER_NAMES } from "./SortOrderName";
import { SortOrder } from "./SortOrder";

export interface ComparableCard {
  dealOrder: number;
  rank: Rank;
  suit?: Suit | undefined;
}

const createCompare =
  (sortOrder: SortOrder) =>
  (first: ComparableCard, second: ComparableCard): number => {
    const tieBreak = () => first.dealOrder - second.dealOrder;
    switch (sortOrder) {
      case SortOrder.DealOrder:
        return tieBreak();
      case SortOrder.Ascending: {
        const rankDiff = first.rank - second.rank;
        return rankDiff === 0 ? tieBreak() : rankDiff;
      }
      case SortOrder.Descending:
      default: {
        const rankDiff = second.rank - first.rank;
        return rankDiff === 0 ? tieBreak() : rankDiff;
      }
    }
  };

const compare = Object.fromEntries(
  // eslint-disable-next-line security/detect-object-injection
  SORT_ORDER_NAMES.map((key) => [key, createCompare(SortOrder[key])]),
);

export const sortCards = <T extends ComparableCard>(
  dealtCards: readonly T[],
  sortOrder: SortOrder,
) => {
  const sortOrderName = SORT_ORDER_NAMES.find(
    // eslint-disable-next-line security/detect-object-injection
    (name) => SortOrder[name] === sortOrder,
  );
  if (!sortOrderName) {
    throw new Error(`Invalid sortOrder: ${sortOrder}`);
  }
  // eslint-disable-next-line security/detect-object-injection
  return [...dealtCards].sort(compare[sortOrderName]);
};
