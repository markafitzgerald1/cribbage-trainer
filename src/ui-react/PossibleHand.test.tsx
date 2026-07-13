import { CARD_LABELS, Rank, createCard } from "../game/Card";
import { SORT_ORDER_NAMES, type SortOrderName } from "../ui/SortOrderName";
import { describe, expect, it } from "@jest/globals";
import { PossibleHand } from "./PossibleHand";
import { SortOrder } from "../ui/SortOrder";
import { render } from "@testing-library/react";

describe("possible hand component", () => {
  it("renders a span", () => {
    const { container } = render(
      <PossibleHand
        dealtCards={[]}
        sortOrder={SortOrder.Ascending}
      />,
    );

    expect(container.querySelector("span")).toBeTruthy();
  });

  const keptHand = "10,A,J,4";
  const discard = "5,K";

  const expectedKeptHand: Record<SortOrderName, string> = {
    Ascending: "A♠4♠10♠J♠",
    DealOrder: "10♠A♠J♠4♠",
    Descending: "J♠10♠4♠A♠",
  };
  const expectedDiscard: Record<SortOrderName, string> = {
    Ascending: "5♠K♠",
    DealOrder: "5♠K♠",
    Descending: "K♠5♠",
  };

  function expectPossibleHandRendersSpan(
    hand: string,
    expectedMap: Record<SortOrderName, string>,
    sortOrderName: SortOrderName,
  ) {
    const expected = expectedMap[sortOrderName];

    expect(
      render(
        <PossibleHand
          dealtCards={hand.split(",").map((rankLabel, dealOrder) => ({
            ...createCard(CARD_LABELS.indexOf(rankLabel) as Rank, "♠"),
            dealOrder,
            kept: true,
          }))}
          sortOrder={SortOrder[sortOrderName]}
        />,
      ).container.querySelector("span")!.textContent,
    ).toStrictEqual(expected);
  }

  it.each(SORT_ORDER_NAMES)(
    "renders a span with kept hand sorted in %s order",
    (sortOrderName) => {
      expectPossibleHandRendersSpan(keptHand, expectedKeptHand, sortOrderName);
    },
  );

  it.each(SORT_ORDER_NAMES)(
    "renders a span with discard sorted in %s order",
    (sortOrderName) => {
      expectPossibleHandRendersSpan(discard, expectedDiscard, sortOrderName);
    },
  );
});
