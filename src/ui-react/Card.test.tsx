import { describe, expect, it, jest } from "@jest/globals";
import { Card } from "./Card";
import { DealtCard } from "../game/DealtCard";
import React from "react";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";

describe("card", () => {
  const createAndRenderCard = () => {
    const dealtCards: readonly DealtCard[] = dealHand();
    const setDealtCards = jest.fn();
    const dealOrderIndex = Math.floor(Math.random() * dealtCards.length);
    const { getByRole, queryByRole } = render(
      <Card
        dealOrderIndex={dealOrderIndex}
        dealtCards={dealtCards}
        setDealtCards={setDealtCards}
      />
    );

    return { dealOrderIndex, dealtCards, getByRole, queryByRole };
  };

  it("returns a list item", () => {
    const { queryByRole } = createAndRenderCard();

    expect(queryByRole("listitem")).toBeTruthy();
  });

  it("text is its rank label", () => {
    const { dealOrderIndex, getByRole, dealtCards } = createAndRenderCard();

    expect(getByRole("listitem").textContent).toBe(
      dealtCards[dealOrderIndex]!.rankLabel
    );
  });
});
