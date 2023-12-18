import { SortOrder } from "./SortOrder";

export type SortOrderName = keyof typeof SortOrder;

export const SORT_ORDER_NAMES = Object.keys(SortOrder)
  .filter((key) => isNaN(Number(key)))
  .map((key) => key as SortOrderName);

export const lowerCaseSpaceSeparatedSortOrderName = Object.fromEntries(
  SORT_ORDER_NAMES.map((sortOrderName) => [
    sortOrderName,
    sortOrderName
      .replace(
        /(?<lastLower>[a-z])(?<nextFirstUpper>[A-Z])/u,
        "$<lastLower> $<nextFirstUpper>",
      )
      .toLowerCase(),
  ]),
) as {
  [K in SortOrderName]: string;
};
