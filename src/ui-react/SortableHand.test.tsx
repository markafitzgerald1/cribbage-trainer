import React, { useState } from "react";
import { SORT_ORDER_NAMES, SortOrderName } from "../ui/SortOrderName";
import { describe, expect, it } from "@jest/globals";
import { DealtCard } from "../game/DealtCard";
import { SortLabel } from "./SortOrderInput";
import { SortOrder } from "../ui/SortOrder";
import { SortableHand } from "./SortableHand";
import { create } from "../game/randomNumberGenerator";
import { dealHand } from "../game/dealHand";
import { handToSortedString } from "./handToSortedString.test.common";
import { render } from "@testing-library/react";
import { sortCards } from "../ui/sortCards";

describe("sortable hand input component", () => {
  function ComponentContainer({
    initialSortOrder,
    initialDealtCards,
  }: {
    readonly initialSortOrder: SortOrder;
    readonly initialDealtCards: readonly DealtCard[];
  }) {
    const [dealtCards, setDealtCards] =
      useState<readonly DealtCard[]>(initialDealtCards);
    const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
    return (
      <div>
        <SortableHand
          dealtCards={dealtCards}
          setDealtCards={setDealtCards}
          setSortOrder={setSortOrder}
          sortOrder={sortOrder}
        />
      </div>
    );
  }

  function renderComponent(
    initialDealtCards: readonly DealtCard[] = dealHand(create()),
    initialSortOrder: SortOrder = SortOrder.Ascending,
  ) {
    return render(
      <ComponentContainer
        initialDealtCards={initialDealtCards}
        initialSortOrder={initialSortOrder}
      />,
    );
  }

  it.each(SORT_ORDER_NAMES)(
    "initially renders the dealt cards in the specified initial %s order",
    (sortOrderName) => {
      const handCards = dealHand(create());
      const sortOrder = SortOrder[sortOrderName];
      expect(
        renderComponent(handCards, sortOrder).container.textContent,
      ).toContain(handToSortedString(handCards, sortOrder));
    },
  );

  it.each([SortOrder.Ascending, SortOrder.Descending])(
    "reorders cards when sort order is changed from deal order to %s",
    (sortOrder) => {
      const handCards = dealHand(create());
      const { container, getByText } = renderComponent(handCards);
      const sortOrderButton = getByText(
        SortLabel[SortOrder[sortOrder] as SortOrderName],
      );
      sortOrderButton.click();
      expect(container.textContent).toContain(
        sortCards(handCards, sortOrder)
          .map((dealtCard) => dealtCard.rankLabel)
          .join(""),
      );
    },
  );
});
