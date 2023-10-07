import { SortOrder } from "../ui/SortOrder";

export interface SortOrderInputProps {
  readonly sortOrder: SortOrder;
  readonly setSortOrder: (sort: SortOrder) => void;
}
