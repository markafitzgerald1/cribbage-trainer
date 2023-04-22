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
  it("is an unordered list", () => {
    const dealtHand = dealHand();
    const { queryByRole } = render(
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
    expect(queryByRole("list")).toBeTruthy();
  });
});
