/* jscpd:ignore-start */
import React, { useState } from "react";
import { describe, expect, it } from "@jest/globals";
import { DealtCard } from "../game/DealtCard";
import { Hand } from "./Hand";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";
import { sortCards } from "../ui/sortCards";
import { sortOrderNames } from "../ui/SortOrderName";
/* jscpd:ignore-end */

function HandContainer({
  dealtHand,
  createComponent,
}: {
  readonly dealtHand: readonly DealtCard[];
  readonly createComponent: ({
    dealtCards,
    setDealtCards,
  }: {
    dealtCards: readonly DealtCard[];
    setDealtCards: React.Dispatch<React.SetStateAction<readonly DealtCard[]>>;
  }) => JSX.Element;
}) {
  const [dealtCards, setDealtCards] = useState<readonly DealtCard[]>(dealtHand);
  return <div>{createComponent({ dealtCards, setDealtCards })}</div>;
}

describe("hand component", () => {
  const dealAndRender = (sortOrder: SortOrder) => {
    const dealtHand = dealHand(Math.random);

    const { getAllByRole, queryAllByText, queryByRole, queryByText } = render(
      <HandContainer
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
