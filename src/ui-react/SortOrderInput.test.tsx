import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";
import { render } from "@testing-library/react";
import { sortOrderNames } from "../ui/SortOrderName";

describe("sort order input component", () => {
  const renderComponent = () =>
    render(
      <SortOrderInput
        setSortOrder={jest.fn()}
        sortOrder={SortOrder.Ascending}
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
});
