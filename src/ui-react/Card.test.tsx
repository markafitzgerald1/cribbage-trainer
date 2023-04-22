import React, { useState } from "react";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { Card } from "./Card";
import { DealtCard } from "../game/DealtCard";
import { dealHand } from "../game/dealHand";

describe("card", () => {
  function CardContainer({
    dealtHand,
    dealOrderIndex,
  }: {
    dealtHand: readonly DealtCard[];
    dealOrderIndex: number;
  }) {
    const [dealtCards, setDealtCards] =
      useState<readonly DealtCard[]>(dealtHand);
    return (
      <div>
        <Card
          dealOrderIndex={dealOrderIndex}
          dealtCards={dealtCards}
          setDealtCards={setDealtCards}
        />
      </div>
    );
  }

  const dealCreateAndRenderCardContainer = ({
    dealOrderIndex = 0,
    kept = true,
  }) => {
    const dealtHand = dealHand();
    dealtHand[dealOrderIndex]!.kept = kept;
    const { getByRole, queryByRole } = render(
      <CardContainer
        dealOrderIndex={dealOrderIndex}
        dealtHand={dealtHand}
      />
    );
    return { dealtHand, getByRole, queryByRole };
  };

  it("returns a list item", () => {
    const { queryByRole } = dealCreateAndRenderCardContainer({});

    expect(queryByRole("listitem")).toBeTruthy();
  });

  it("text is its rank label", () => {
    const dealOrderIndex = 0;
    const { dealtHand, getByRole } = dealCreateAndRenderCardContainer({
      dealOrderIndex,
    });

    expect(getByRole("listitem").textContent).toBe(
      dealtHand[dealOrderIndex]!.rankLabel
    );
  });

  const expectCardListItemHasClass = ({
    className,
    hasClass,
    kept,
  }: {
    className: string;
    hasClass: boolean;
    kept: boolean;
  }) =>
    expect(
      dealCreateAndRenderCardContainer({ kept })
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

  const expectKeptAndDiscardedAfterClick = (kept: boolean) => {
    const { getByRole } = dealCreateAndRenderCardContainer({ kept });

    fireEvent.click(getByRole("listitem"));

    expect(getByRole("listitem").classList.contains("discarded")).toBe(kept);
  };

  it("if kept, has class 'discarded' after being clicked", () =>
    expectKeptAndDiscardedAfterClick(true));

  it("if not kept, does not have class 'discarded' after being clicked", () =>
    expectKeptAndDiscardedAfterClick(false));
});
