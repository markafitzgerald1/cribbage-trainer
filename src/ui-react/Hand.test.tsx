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

    const { getAllByRole, queryAllByText, queryByRole, queryByText } = render(
      <DealComponentContainer
        createComponent={({ dealtCards, setDealtCards }) => (
          <Hand
            dealtCards={dealtCards}
            setDealtCards={setDealtCards}
            sortOrder={sortOrder}
          />
        )}
        dealtHand={dealtHand}
      />,
    );

    return {
      dealtHand,
      getAllByRole,
      queryAllByText,
      queryByRole,
      queryByText,
    };
  };

  const caption = "Dealt hand:";

  it(`has caption '${caption}'`, () => {
    expect(
      dealAndRender(SortOrder.Ascending).queryByText(caption),
    ).toBeTruthy();
  });

  it("has a checkbox for each dealt card", () => {
    const { dealtHand, getAllByRole } = dealAndRender(SortOrder.Ascending);

    expect(getAllByRole("checkbox")).toHaveLength(dealtHand.length);
  });

  it.each(sortOrderNames)(
    "has a sorted checkbox for each dealt card in %s order",
    (sortOrderName) => {
      const sortOrder = SortOrder[sortOrderName];
      const { dealtHand, queryAllByText } = dealAndRender(sortOrder);
      const sortedDealtHand = sortCards(dealtHand, sortOrder);

      sortedDealtHand.forEach((card) => {
        expect(queryAllByText(card.rankLabel)).not.toHaveLength(0);
      });
    },
  );
});
