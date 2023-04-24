import { describe, expect, it, jest } from "@jest/globals";
import {
  lowerCaseSpaceSeparatedSortOrderName,
  sortOrderNames,
} from "../ui/SortOrderName";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";
import { render } from "@testing-library/react";

describe("sort order input component", () => {
  const renderComponent = (sortOrder = SortOrder.Ascending) =>
    render(
      <SortOrderInput
        setSortOrder={jest.fn()}
        sortOrder={sortOrder}
      />
    );

  it("contains a group", () =>
    expect(renderComponent().queryByRole("group")).toBeTruthy());

  it("contains a radio button for each sort order", () =>
    expect(renderComponent().queryAllByRole("radio")).toHaveLength(
      sortOrderNames.length
    ));

  it.each(sortOrderNames)(
    "contains a %s labeled radio button",
    (sortOrderName) =>
      expect(
        renderComponent().queryByLabelText(
          SortOrderInput.SortLabel[sortOrderName]
        )
      ).toBeTruthy()
  );

  it.each(sortOrderNames)(
    "displays the %s sort order description when in that initial sort state",
    (sortOrderName) =>
      expect(
        renderComponent(SortOrder[sortOrderName]).queryByText(
          `(${lowerCaseSpaceSeparatedSortOrderName[sortOrderName]})`
        )
      ).toBeTruthy()
  );
});
