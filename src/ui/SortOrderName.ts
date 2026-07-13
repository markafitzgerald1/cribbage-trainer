import { SortOrder } from "./SortOrder";

export type SortOrderName = keyof typeof SortOrder;

export const SORT_ORDER_NAMES = Object.keys(SortOrder)
  .filter((key) => isNaN(Number(key)))
  .map((key) => key as SortOrderName);

export const getSortOrderName = (sortOrder: SortOrder) =>
  // eslint-disable-next-line security/detect-object-injection
  SORT_ORDER_NAMES.find((name) => SortOrder[name] === sortOrder);

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
