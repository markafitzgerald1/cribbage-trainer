import {
  SORT_ORDER_NAMES,
  SortOrderName,
  lowerCaseSpaceSeparatedSortOrderName,
} from "../ui/SortOrderName";
import { SortLabel, SortOrderInput } from "./SortOrderInput";
import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("sort order input component", () => {
  function renderComponent({
    initialSortOrder = SortOrder.Ascending,
    onChange = jest.fn(),
  }: {
    initialSortOrder?: SortOrder;
    onChange?: (sortOrder: SortOrder) => void;
  } = {}) {
    return render(
      <SortOrderInput
        onChange={onChange}
        sortOrder={initialSortOrder}
      />,
    );
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
        renderComponent().queryByLabelText(SortLabel[sortOrderName]),
      ).toBeTruthy(),
  );

  it.each(SORT_ORDER_NAMES)(
    "contains a checked %s labeled radio button when in that initial sort state",
    (sortOrderName) =>
      expect(
        renderComponent({ initialSortOrder: SortOrder[sortOrderName] })
          .queryByLabelText(SortLabel[sortOrderName])
          ?.attributes.getNamedItem("checked"),
      ).toBeTruthy(),
  );

  it.each(SORT_ORDER_NAMES)(
    "displays the %s sort order description when in that initial sort state",
    (sortOrderName) =>
      expect(
        renderComponent({
          initialSortOrder: SortOrder[sortOrderName],
        }).queryByText(
          `${lowerCaseSpaceSeparatedSortOrderName[sortOrderName]}`,
        ),
      ).toBeTruthy(),
  );

  it.each(SORT_ORDER_NAMES)(
    "onChange(%s) is called after %s click",
    async (sortOrderName) => {
      const user = userEvent.setup();
      const sortOrder = SortOrder[sortOrderName];
      const mockOnChange = jest.fn();
      const { queryAllByRole } = renderComponent({
        initialSortOrder:
          SortOrder[
            SortOrder[
              (sortOrder + 1) % SORT_ORDER_NAMES.length
            ] as SortOrderName
          ],
        onChange: mockOnChange,
      });
      const radioButton = queryAllByRole("radio")[
        sortOrder
      ] as HTMLInputElement;

      await user.click(radioButton);

      expect(mockOnChange).toHaveBeenCalledWith(sortOrder);
    },
  );
});
