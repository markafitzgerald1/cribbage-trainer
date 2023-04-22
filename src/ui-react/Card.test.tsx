import { describe, expect, it, jest } from "@jest/globals";
import { Card } from "./Card";
import { DealtCard } from "../game/DealtCard";
import React from "react";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";

describe("card", () => {
  const createAndRenderCard = ({ kept }: { kept: boolean }) => {
    const dealtCards: readonly DealtCard[] = dealHand();
    const setDealtCards = jest.fn();
    const dealOrderIndex = Math.floor(Math.random() * dealtCards.length);
    dealtCards[dealOrderIndex]!.kept = kept;
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
    const { queryByRole } = createAndRenderCard({ kept: true });

    expect(queryByRole("listitem")).toBeTruthy();
  });

  it("text is its rank label", () => {
    const { dealOrderIndex, getByRole, dealtCards } = createAndRenderCard({
      kept: true,
    });

    expect(getByRole("listitem").textContent).toBe(
      dealtCards[dealOrderIndex]!.rankLabel
    );
  });

  const expectCardListItemHasClass = ({
    kept,
    className,
    hasClass,
  }: {
    kept: boolean;
    className: string;
    hasClass: boolean;
  }) =>
    expect(
      createAndRenderCard({ kept })
        .getByRole("listitem")
        .classList.contains(className)
    ).toBe(hasClass);

  it("has class 'card'", () => {
    expectCardListItemHasClass({
      className: "card",
      hasClass: true,
      kept: true,
    });
  });

  it("does not have class 'discarded' when kept", () => {
    expectCardListItemHasClass({
      className: "discarded",
      hasClass: false,
      kept: true,
    });
  });

  it("has class 'discarded' when not kept", () => {
    expectCardListItemHasClass({
      className: "discarded",
      hasClass: true,
      kept: false,
    });
  });
});
