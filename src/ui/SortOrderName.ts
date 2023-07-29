import { SortOrder } from "./SortOrder";

export type SortOrderName = keyof typeof SortOrder;

export const sortOrderNames = Object.keys(SortOrder)
  .filter((key) => isNaN(Number(key)))
  .map((key) => key as SortOrderName);

export const lowerCaseSpaceSeparatedSortOrderName = Object.fromEntries(
  sortOrderNames.map((sortOrderName) => [
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
