import { SORT_ORDER_NAMES, type SortOrderName } from "../ui/SortOrderName";
import { SortLabel, SortOrderInput } from "./SortOrderInput";
import { cleanup, render } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { SortOrder } from "../ui/SortOrder";
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
    "onChange(%s) is called after %s click",
    async (sortOrderName) => {
      const user = userEvent.setup();
      const sortOrder = SortOrder[sortOrderName];
      const mockOnChange = jest.fn();
      const { findByLabelText } = renderComponent({
        initialSortOrder:
          SortOrder[
            SORT_ORDER_NAMES[
              (SORT_ORDER_NAMES.indexOf(sortOrderName) + 1) %
                SORT_ORDER_NAMES.length
            ] as SortOrderName
          ],
        onChange: mockOnChange,
      });
      const radioButton = await findByLabelText(SortLabel[sortOrderName]);

      await user.click(radioButton);

      expect(mockOnChange).toHaveBeenCalledWith(sortOrder);
    },
  );

  it("radio buttons all have same name", () => {
    const radioButtons = renderComponent().queryAllByRole(
      "radio",
    ) as HTMLInputElement[];

    expect(
      radioButtons.every((btn, _index, arr) => btn.name === arr[0]!.name),
    ).toBe(true);
  });

  it("radio buttons in have different names in different instances", () => {
    const radioButtons1 = renderComponent().queryAllByRole(
      "radio",
    ) as HTMLInputElement[];
    cleanup();
    const radioButtons2 = renderComponent().queryAllByRole(
      "radio",
    ) as HTMLInputElement[];

    expect(
      radioButtons1.every((btn1) =>
        radioButtons2.every((btn2) => btn1.name !== btn2.name),
      ),
    ).toBe(true);
  });
});
