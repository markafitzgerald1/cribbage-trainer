import { describe, expect, it, jest } from "@jest/globals";
import { Hand } from "./Hand";
import React from "react";
/* jscpd:ignore-start */
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";
import { sortCards } from "../ui/sortCards";
/* jscpd:ignore-end */

describe("hand component", () => {
  const dealAndRender = (sortOrder: SortOrder) => {
    const dealtHand = dealHand(Math.random);

    const { getAllByRole, queryAllByText, queryByRole, queryByText } = render(
      <Hand
        dealtCards={dealtHand}
        onChange={jest.fn()}
        sortOrder={sortOrder}
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

  it.each(SORT_ORDER_NAMES)(
    "has the rank of each dealt card in %s order",
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
