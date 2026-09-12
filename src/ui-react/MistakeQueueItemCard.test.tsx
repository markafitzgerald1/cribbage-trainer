import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import {
  mockItemA,
  mockTradeOffClassification,
} from "../ui/mistakeQueue.test.common";
import { CribRole } from "../game/expectedCribPoints";
import { MistakeQueueItemCard } from "./MistakeQueueItemCard";
import { SortOrder } from "../ui/SortOrder";

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

    expect(getByText("Prev: Crib")).toBeInTheDocument();
    expect(
      getByTitle("Previous discard (1.00 pts lost) driven by Crib"),
    ).toBeInTheDocument();
  });

  it("renders loss reason and recomputed loss when classification is provided", () => {
    const { getByText, getByTitle } = render(
      <MistakeQueueItemCard
        classification={mockTradeOffClassification}
        item={mockItemA}
        onPractice={null}
        sortOrder={SortOrder.DealOrder}
      />,
    );

    expect(getByText("Prev: Hand loss > Crib gain")).toBeInTheDocument();
    expect(
      getByTitle(
        "Previous discard (0.10 pts lost) driven by Hand loss > Crib gain",
      ),
    ).toBeInTheDocument();
  });

  it("does not render loss reason badge when lossReason is null", () => {
    const { queryByTitle } = renderCard({ lossReason: null });

    expect(queryByTitle(/driven by/u)).toBeNull();
  });

  it("does not render loss reason badge when lossReason is omitted", () => {
    const { queryByTitle } = renderCard();

    expect(queryByTitle(/driven by/u)).toBeNull();
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

  it.each([
    {
      cribRole: mockItemA.cribRole,
      isMastered: true,
      quantile: "medium" as const,
      role: "Dealer",
    },
    {
      cribRole: mockItemA.cribRole,
      isMastered: false,
      quantile: "high" as const,
      role: "Dealer",
    },
    {
      cribRole: CribRole.Pone,
      isMastered: false,
      quantile: "low" as const,
      role: "Pone",
    },
  ])(
    "renders quantile $quantile and role $role",
    ({ cribRole, isMastered, quantile, role }) => {
      const { getByText } = renderCard({
        item: {
          ...mockItemA,
          cribRole,
          isMastered,
          lossQuantile: quantile,
        },
      });

      expect(getByText(quantile)).toBeInTheDocument();
      expect(getByText(role)).toBeInTheDocument();
    },
  );

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
