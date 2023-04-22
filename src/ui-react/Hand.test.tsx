/* jscpd:ignore-start */
import { describe, expect, it } from "@jest/globals";
import { DealComponentContainer } from "./DealComponentContainer";
import { Hand } from "./Hand";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";
/* jscpd:ignore-end */

describe("hand component", () => {
  const dealAndRender = () => {
    const dealtHand = dealHand();

    const { queryByRole, getAllByRole } = render(
      <DealComponentContainer
        createComponent={({ dealtCards, setDealtCards }) => (
          <Hand
            dealtCards={dealtCards}
            setDealtCards={setDealtCards}
            sortOrder={SortOrder.Ascending}
          />
        )}
        dealtHand={dealtHand}
      />
    );

    return { dealtHand, getAllByRole, queryByRole };
  };

  it("is an unordered list", () => {
    expect(dealAndRender().queryByRole("list")).toBeTruthy();
  });

  it("has a list item for each dealt card", () => {
    const { dealtHand, getAllByRole } = dealAndRender();

    expect(getAllByRole("listitem")).toHaveLength(dealtHand.length);
  });
});
