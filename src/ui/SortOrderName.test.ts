import {
  SORT_ORDER_NAMES,
  type SortOrderName,
  lowerCaseSpaceSeparatedSortOrderName,
} from "./SortOrderName";
import { describe, expect, it } from "@jest/globals";
import { SortOrder } from "./SortOrder";

describe("lowerCaseSpaceSeparatedSortOrderName", () => {
  it("contains one entry per sort order", () => {
    expect(Object.keys(lowerCaseSpaceSeparatedSortOrderName)).toHaveLength(
      SORT_ORDER_NAMES.length,
    );
  });

  const valueToKey = Object.fromEntries(
    Object.entries(SortOrder).map(([key, value]) => [value, key]),
  );

  it.each([
    [SortOrder.Ascending, "ascending"],
    [SortOrder.Descending, "descending"],
    [SortOrder.DealOrder, "deal order"],
  ])("%s should be %s", (sortOrder, expectedValue) => {
    expect(
      lowerCaseSpaceSeparatedSortOrderName[
        valueToKey[String(sortOrder)] as SortOrderName
      ],
    ).toBe(expectedValue);
  });
});
