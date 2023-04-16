import { SortOrder } from "./SortOrder";

export type SortOrderName = keyof typeof SortOrder;

export const sortOrderNames = Object.keys(SortOrder)
  .filter((key) => isNaN(Number(key)))
  .map((key) => key as SortOrderName);
