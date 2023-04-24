import {
  SortOrderName,
  lowerCaseSpaceSeparatedSortOrderName,
  sortOrderNames,
} from "./SortOrderName";
import { describe, expect, it } from "@jest/globals";
import { SortOrder } from "./SortOrder";

describe("lowerCaseSpaceSeparatedSortOrderName", () => {
  it("contains one entry per sort order", () => {
    expect(Object.keys(lowerCaseSpaceSeparatedSortOrderName)).toHaveLength(
      sortOrderNames.length
    );
  });

  it.each([
    [SortOrder.Ascending, "ascending"],
    [SortOrder.Descending, "descending"],
    [SortOrder.DealOrder, "deal order"],
  ])("%s should be %s", (sortOrder, expectedValue) =>
    expect(
      lowerCaseSpaceSeparatedSortOrderName[
        SortOrder[sortOrder] as SortOrderName
      ]
    ).toBe(expectedValue)
  );
});
