import { readStoredSortOrder, storeSortOrder } from "../ui/sortOrderPreference";
import { useCallback, useState } from "react";
import { SortOrder } from "../ui/SortOrder";

export interface UseSortOrderResult {
  readonly changeSortOrder: (newSortOrder: SortOrder) => void;
  readonly setSortOrder: (sortOrder: SortOrder) => void;
  readonly sortOrder: SortOrder;
}

export const useSortOrder = (
  initialSortOrder: SortOrder | null,
  markHistoryUpdate: () => void,
): UseSortOrderResult => {
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    () => initialSortOrder ?? readStoredSortOrder() ?? SortOrder.Descending,
  );

  const changeSortOrder = useCallback(
    (newSortOrder: SortOrder) => {
      markHistoryUpdate();
      setSortOrder(newSortOrder);
      storeSortOrder(newSortOrder);
    },
    [markHistoryUpdate],
  );

  return {
    changeSortOrder,
    setSortOrder,
    sortOrder,
  };
};
