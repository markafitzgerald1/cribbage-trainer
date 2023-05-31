/* jscpd:ignore-start */
import { describe, expect, it } from "@jest/globals";
import { DealComponentContainer } from "./DealComponentContainer";
import { Hand } from "./Hand";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";
import { sortCards } from "../ui/sortCards";
import { sortOrderNames } from "../ui/SortOrderName";
/* jscpd:ignore-end */

describe("hand component", () => {
  const dealAndRender = (sortOrder: SortOrder) => {
    const dealtHand = dealHand(Math.random);

    const { queryByRole, queryByText, getAllByRole } = render(
      <DealComponentContainer
        createComponent={({ dealtCards, setDealtCards }) => (
          <Hand
            dealtCards={dealtCards}
            setDealtCards={setDealtCards}
            sortOrder={sortOrder}
          />
        )}
        dealtHand={dealtHand}
      />
    );

    return { dealtHand, getAllByRole, queryByRole, queryByText };
  };

  const caption = "Dealt hand:";

  it(`has caption '${caption}'`, () => {
    expect(
      dealAndRender(SortOrder.Ascending).queryByText(caption)
    ).toBeTruthy();
  });

  it("has a list item for each dealt card", () => {
    const { dealtHand, getAllByRole } = dealAndRender(SortOrder.Ascending);

    expect(getAllByRole("listitem")).toHaveLength(dealtHand.length);
  });

  it.each(sortOrderNames)(
    "has a sorted list item for each dealt card in %s order",
    (sortOrderName) => {
      const sortOrder = SortOrder[sortOrderName];
      const { dealtHand, getAllByRole } = dealAndRender(sortOrder);
      const sortedDealtHand = sortCards(dealtHand, sortOrder);

      const listItems = getAllByRole("listitem");

      listItems.forEach((listItem, index) => {
        expect(listItem.textContent).toBe(sortedDealtHand[index]!.rankLabel);
      });
    }
  );
});
