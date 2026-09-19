import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import {
  mockItemA,
  mockOppositeRoleClassification,
  mockTradeOffClassification,
} from "../ui/mistakeQueue.test.common";
import { CribRole } from "../game/expectedCribPoints";
import type { MistakeClassification } from "../analysis/classifyMistake";
import { MistakeQueueItemCard } from "./MistakeQueueItemCard";
import { SortOrder } from "../ui/SortOrder";

interface RenderCardOptions {
  readonly item?: typeof mockItemA;
  readonly lossReason?: string | null;
  readonly onPractice?: ((item: typeof mockItemA) => void) | null;
}

const noop = () => null;

const renderClassifiedCard = (
  classification: MistakeClassification | null,
  cribRole: CribRole = mockItemA.cribRole,
) =>
  render(
    <MistakeQueueItemCard
      classification={classification}
      item={{ ...mockItemA, cribRole }}
      onPractice={null}
      sortOrder={SortOrder.DealOrder}
    />,
  );

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
    const { getByRole, getByText, getByTitle } = renderClassifiedCard(
      mockTradeOffClassification,
    );

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
      classification: mockOppositeRoleClassification,
      cribRole: CribRole.Dealer,
      expectedLabel: "Optimal as pone",
      expectedName: "Previous discard optimal as pone, not as dealer",
      name: "names the reversed role for a dealer",
    },
    {
      classification: mockOppositeRoleClassification,
      cribRole: CribRole.Pone,
      expectedLabel: "Optimal as dealer",
      expectedName: "Previous discard optimal as dealer, not as pone",
      name: "names the reversed role for a pone",
    },
  ])(
    "$name, beside the component badge rather than instead of it",
    ({ classification, cribRole, expectedLabel, expectedName }) => {
      const { getByRole, getByText } = renderClassifiedCard(
        classification,
        cribRole,
      );

      const badge = getByRole("note", { name: expectedName });

      expect(badge).toHaveTextContent(expectedLabel);
      expect(badge).toHaveAttribute("title", expectedName);
      expect(getByText("Prev: Crib gain < Hand loss")).toBeInTheDocument();
    },
  );

  it.each([
    { classification: mockTradeOffClassification, name: "is false" },
    { classification: null, name: "is absent" },
  ])(
    "renders no reversed-role badge when the opposite-role flag $name",
    ({ classification }) => {
      const { queryByRole } = renderClassifiedCard(classification);

      expect(queryByRole("note", { name: /optimal as/u })).toBeNull();
    },
  );

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
