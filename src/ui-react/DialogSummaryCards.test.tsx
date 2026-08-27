import { describe, expect, it } from "@jest/globals";
import { DialogSummaryCards } from "./DialogSummaryCards";
import { render } from "@testing-library/react";

const mockSummaryClasses = {
  summaryCard: "mock-summary-card",
  summaryCards: "mock-summary-cards",
  summaryLabel: "mock-summary-label",
  summaryValue: "mock-summary-value",
};

describe("dialogSummaryCards", () => {
  it("renders metric labels and values", () => {
    const { getByText } = render(
      <DialogSummaryCards
        classes={mockSummaryClasses}
        metrics={[
          { label: "Metric One", value: 42 },
          { label: "Metric Two", value: "85%" },
        ]}
      />,
    );

    expect(getByText("Metric One").textContent).toBe("Metric One");
    expect(getByText("42").textContent).toBe("42");
    expect(getByText("Metric Two").textContent).toBe("Metric Two");
    expect(getByText("85%").textContent).toBe("85%");
  });
});
