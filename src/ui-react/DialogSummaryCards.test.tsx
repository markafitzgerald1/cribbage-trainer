/* jscpd:ignore-start */
import { describe, expect, it } from "@jest/globals";
import { DialogSummaryCards } from "./DialogSummaryCards";
import { render } from "@testing-library/react";
/* jscpd:ignore-end */

const mockSummaryClasses = {
  summaryCard: "mock-summary-card",
  summaryCards: "mock-summary-cards",
  summaryLabel: "mock-summary-label",
  summaryValue: "mock-summary-value",
};

describe("dialogSummaryCards", () => {
  it("renders metric labels and values and exposes notes for supplied accessible values", () => {
    const { getByRole, getByText } = render(
      <DialogSummaryCards
        classes={mockSummaryClasses}
        metrics={[
          { label: "Metric One", value: 42 },
          { accessibleValue: null, label: "Metric Three", value: "unnamed" },
          {
            accessibleValue: "Metric Two: 85 percent",
            label: "Metric Two",
            value: "85%",
          },
        ]}
      />,
    );

    expect(getByText("Metric One").textContent).toBe("Metric One");
    expect(getByText("42").textContent).toBe("42");
    expect(getByText("Metric Two").textContent).toBe("Metric Two");
    expect(
      ["42", "unnamed"].map((value) => getByText(value).getAttribute("role")),
    ).toStrictEqual([null, null]);
    expect(
      getByRole("note", { name: "Metric Two: 85 percent" }).textContent,
    ).toBe("85%");
  });
});
