import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { MistakeQueueItemCard } from "./MistakeQueueItemCard";
import { SortOrder } from "../ui/SortOrder";
import { mockItemA } from "../ui/mistakeQueue.test.common";

interface RenderCardOptions {
  readonly item?: typeof mockItemA;
  readonly lossReason?: string | null;
  readonly onPractice?: ((item: typeof mockItemA) => void) | null;
}

const noop = () => null;

const renderCard = (options: RenderCardOptions = {}) => {
  const { item = mockItemA, lossReason, onPractice = noop } = options;

  return render(
    <MistakeQueueItemCard
      item={item}
      lossReason={lossReason}
      onPractice={onPractice}
      sortOrder={SortOrder.DealOrder}
    />,
  );
};

describe("mistakeQueueItemCard", () => {
  it("renders loss reason badge when provided", () => {
    const { getByText, getByTitle } = renderCard({ lossReason: "Crib" });

    expect(getByText("Crib")).toBeInTheDocument();
    expect(getByTitle("Loss driven by Crib")).toBeInTheDocument();
  });

  it("does not render loss reason badge when lossReason is null", () => {
    const { queryByTitle } = renderCard({ lossReason: null });

    expect(queryByTitle(/Loss driven by/u)).toBeNull();
  });

  it("does not render loss reason badge when lossReason is omitted", () => {
    const { queryByTitle } = renderCard();

    expect(queryByTitle(/Loss driven by/u)).toBeNull();
  });

  it("calls onPractice handler when practice button is clicked", () => {
    let practicedItem: typeof mockItemA | null = null;
    const { getByRole } = renderCard({
      onPractice: (item) => {
        practicedItem = item;
      },
    });
    fireEvent.click(getByRole("button", { name: "Practice this" }));

    expect(practicedItem).toBe(mockItemA);
  });

  it("does not render practice button when onPractice is null", () => {
    const { queryByRole } = renderCard({ onPractice: null });

    expect(queryByRole("button", { name: "Practice this" })).toBeNull();
  });

  it("renders mastered state correctly", () => {
    const { getByText } = renderCard({
      item: {
        ...mockItemA,
        isMastered: true,
        lossQuantile: "medium",
      },
    });

    expect(getByText("Mastered")).toBeInTheDocument();
    expect(getByText("medium")).toBeInTheDocument();
  });

  it("renders fallback text when previous discard is null", () => {
    const { getByText } = renderCard({
      item: {
        ...mockItemA,
        lossQuantile: null,
        previousDiscard: null,
      },
    });

    expect(getByText("Previous choice not recorded")).toBeInTheDocument();
  });
});
