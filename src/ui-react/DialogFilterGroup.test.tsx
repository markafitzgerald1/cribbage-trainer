/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { DIALOG_ROLE_OPTIONS, DialogFilterGroup } from "./DialogFilterGroup";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
/* jscpd:ignore-end */

const mockFilterClasses = {
  filterGroup: "mock-filter-group",
  input: "mock-input",
  option: "mock-option",
};

describe("dialogFilterGroup", () => {
  it("renders options and triggers onChange when radio is clicked", () => {
    const handleChange = jest.fn();
    const { getByLabelText, getByRole } = render(
      <DialogFilterGroup
        classes={mockFilterClasses}
        currentValue="all"
        groupName="test-filter"
        legendText="Test Filter"
        onChange={handleChange}
        options={DIALOG_ROLE_OPTIONS}
      />,
    );

    const allRadio = getByRole("radio", { name: "All roles" });
    const dealerRadio = getByRole("radio", { name: "Dealer" });

    expect((allRadio as HTMLInputElement).checked).toBe(true);
    expect((dealerRadio as HTMLInputElement).checked).toBe(false);

    fireEvent.click(dealerRadio);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(getByLabelText("Dealer")).toBeInTheDocument();
  });
});
