import { SORT_ORDER_NAMES, type SortOrderName } from "../ui/SortOrderName";
import { describe, expect, it, jest } from "@jest/globals";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import { InteractiveHand } from "./InteractiveHand";
import { SortLabel } from "./SortOrderInput";
import { SortOrder } from "../ui/SortOrder";
import { act } from "react";
import { createGenerator } from "../game/randomNumberGenerator";
import { dealHand } from "../game/dealHand";
import { handToSortedString } from "./handToSortedString.test.common";
import { render } from "@testing-library/react";

describe("sortable hand input component", () => {
  function renderComponent(initialSortOrder: SortOrder = SortOrder.Ascending) {
    const handCards = dealHand(createGenerator());
    const onCardChange = jest.fn();
    const onDeal = jest.fn();
    const onSortOrderChange = jest.fn();
    return {
      component: render(
        <InteractiveHand
          dealtCards={handCards}
          onCardChange={onCardChange}
          onDeal={onDeal}
          onSortOrderChange={onSortOrderChange}
          sortOrder={initialSortOrder}
        />,
      ),
      handCards,
      onCardChange,
      onSortOrderChange,
    };
  }

  it.each(SORT_ORDER_NAMES)(
    "initially renders the dealt cards in the specified initial %s order",
    (sortOrderName) => {
      const sortOrder = SortOrder[sortOrderName];
      const { component, handCards } = renderComponent(sortOrder);

      expect(component.container.textContent).toContain(
        handToSortedString(handCards, sortOrder),
      );
    },
  );

  it.each([
    [SortOrder.Descending, SortOrder.Ascending],
    [SortOrder.Descending, SortOrder.DealOrder],
    [SortOrder.Ascending, SortOrder.Descending],
  ])(
    "fires a sort order change event when sort order is changed to %s",
    (initialSortOrder, newSortOrder) => {
      const {
        component: { getByText },
        onSortOrderChange,
      } = renderComponent(initialSortOrder);
      const sortOrderName = SORT_ORDER_NAMES.find(
        (name) => SortOrder[name] === newSortOrder,
      ) as SortOrderName;
      const sortOrderButton = getByText(SortLabel[sortOrderName]);

      act(() => {
        sortOrderButton.click();
      });

      expect(onSortOrderChange).toHaveBeenCalledWith(newSortOrder);
    },
  );

  it.each([...Array(CARDS_PER_DEALT_HAND).keys()])(
    "fires a card change event when deal order card %s is clicked",
    (dealOrderIndex: number) => {
      const {
        component: { container },
        onCardChange,
      } = renderComponent(SortOrder.DealOrder);
      const nthCheckbox = container.querySelectorAll("input[type='checkbox']")[
        dealOrderIndex
      ] as HTMLInputElement;

      act(() => {
        nthCheckbox.click();
      });

      expect(onCardChange).toHaveBeenCalledWith(dealOrderIndex);
    },
  );
});
