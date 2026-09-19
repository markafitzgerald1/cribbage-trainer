import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import {
  mockItemA,
  mockItemWithRoleLossPair,
  mockTradeOffClassification,
} from "../ui/mistakeQueue.test.common";
import { CribRole } from "../game/expectedCribPoints";
import type { MistakeClassification } from "../analysis/classifyMistake";
import { MistakeQueueItemCard } from "./MistakeQueueItemCard";
import { SortOrder } from "../ui/SortOrder";

interface RenderCardOptions {
  readonly classification?: MistakeClassification | null;
  readonly item?: typeof mockItemA;
  readonly lossReason?: string | null;
  readonly onPractice?: ((item: typeof mockItemA) => void) | null;
}

const noop = () => null;

const renderCard = (options: RenderCardOptions = {}) => {
  /*
   * `classification` is deliberately left undefined rather than defaulted to
   * null here: passing it explicitly would skip the component's own
   * defaultProps branch, which is then covered by nothing.
   */
  const {
    classification,
    item = mockItemA,
    lossReason,
    onPractice = noop,
  } = options;

  return render(
    <MistakeQueueItemCard
      classification={classification}
      item={item}
      lossReason={lossReason}
      onPractice={onPractice}
      sortOrder={SortOrder.DealOrder}
    />,
  );
};

describe("mistakeQueueItemCard", () => {
  it("renders loss reason badge when provided", () => {
    const { getByRole, getByText, getByTitle } = renderCard({
      lossReason: "Crib",
    });

    expect(getByText("Prev: Crib")).toBeInTheDocument();
    expect(
      getByRole("note", { name: "Previous discard driven by Crib" }),
    ).toBeInTheDocument();
    expect(
      getByTitle("Previous discard (1.00 pts lost) driven by Crib"),
    ).toBeInTheDocument();
  });

  it("renders loss reason and recomputed loss when classification is provided", () => {
    const { getByRole, getByText, getByTitle } = renderCard({
      classification: mockTradeOffClassification,
      onPractice: null,
    });

    expect(getByText("Prev: Crib gain < Hand loss")).toBeInTheDocument();
    expect(
      getByRole("note", {
        name: "Previous discard driven by 1.30 Crib gain does not cover 1.40 Hand loss",
      }),
    ).toBeInTheDocument();
    expect(
      getByTitle(
        "Previous discard (0.10 pts lost) driven by 1.30 Crib gain does not cover 1.40 Hand loss",
      ),
    ).toBeInTheDocument();
  });

  it.each([
    {
      cribRole: CribRole.Dealer,
      expectedLabel: "1.00 as dealer, 0.00 as pone",
      expectedName:
        "Previous discard cost 1.00 points lost as dealer, 0.00 as pone",
      name: "names both role costs for a dealer",
    },
    {
      cribRole: CribRole.Pone,
      expectedLabel: "1.00 as pone, 0.00 as dealer",
      expectedName:
        "Previous discard cost 1.00 points lost as pone, 0.00 as dealer",
      name: "names both role costs for a pone",
    },
  ])(
    "$name, beside the component badge rather than instead of it",
    ({ cribRole, expectedLabel, expectedName }) => {
      const { getByRole, getByText } = renderCard({
        classification: mockTradeOffClassification,
        item: { ...mockItemWithRoleLossPair, cribRole },
      });

      const badge = getByRole("note", { name: expectedName });

      expect(badge).toHaveTextContent(expectedLabel);
      expect(badge).toHaveAttribute("title", expectedName);
      expect(getByText("Prev: Crib gain < Hand loss")).toBeInTheDocument();
    },
  );

  it("shows no role-cost badge for a record written before the figure was stored", () => {
    const { queryByRole } = renderCard({ item: mockItemA });

    expect(queryByRole("note", { name: /Previous discard cost/u })).toBeNull();
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
