import React, { useState } from "react";
import {
  SORT_ORDER_NAMES,
  SortOrderName,
  lowerCaseSpaceSeparatedSortOrderName,
} from "../ui/SortOrderName";
import { describe, expect, it } from "@jest/globals";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("sort order input component", () => {
  function ComponentContainer({
    initialSortOrder,
  }: {
    readonly initialSortOrder: SortOrder;
  }) {
    const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
    return (
      <div>
        <SortOrderInput
          setSortOrder={setSortOrder}
          sortOrder={sortOrder}
        />
      </div>
    );
  }

  function renderComponent(initialSortOrder = SortOrder.Ascending) {
    return render(<ComponentContainer initialSortOrder={initialSortOrder} />);
  }

  it("contains a group", () =>
    expect(renderComponent().queryByRole("group")).toBeTruthy());

  it("contains a radio button for each sort order", () =>
    expect(renderComponent().queryAllByRole("radio")).toHaveLength(
      SORT_ORDER_NAMES.length,
    ));

  it.each(SORT_ORDER_NAMES)(
    "contains a %s labeled radio button",
    (sortOrderName) =>
      expect(
        renderComponent().queryByLabelText(
          SortOrderInput.SortLabel[sortOrderName],
        ),
      ).toBeTruthy(),
  );

  it.each(SORT_ORDER_NAMES)(
    "contains a checked %s labeled radio button when in that initial sort state",
    (sortOrderName) =>
      expect(
        renderComponent(SortOrder[sortOrderName])
          .queryByLabelText(SortOrderInput.SortLabel[sortOrderName])
          ?.attributes.getNamedItem("checked"),
      ).toBeTruthy(),
  );

  it.each(SORT_ORDER_NAMES)(
    "displays the %s sort order description when in that initial sort state",
    (sortOrderName) =>
      expect(
        renderComponent(SortOrder[sortOrderName]).queryByText(
          `${lowerCaseSpaceSeparatedSortOrderName[sortOrderName]}`,
        ),
      ).toBeTruthy(),
  );

  it.each(SORT_ORDER_NAMES)(
    "%s is checked after being clicked",
    async (sortOrderName) => {
      const user = userEvent.setup();
      const sortOrder = SortOrder[sortOrderName];
      const { queryAllByRole } = renderComponent(
        SortOrder[
          SortOrder[(sortOrder + 1) % SORT_ORDER_NAMES.length] as SortOrderName
        ],
      );
      const radioButton = queryAllByRole("radio")[
        sortOrder
      ] as HTMLInputElement;

      await user.click(radioButton);

      expect(radioButton.checked).toBeTruthy();
    },
  );
});
