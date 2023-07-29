import { describe, expect, it } from "@jest/globals";
import { Card } from "./Card";
import { DealComponentContainer } from "./DealComponentContainer";
import { DealtCard } from "../game/DealtCard";
import React from "react";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("card component", () => {
  const dealCreateAndRenderCardContainer = ({
    dealOrderIndex = 0,
    kept = true,
  }) => {
    const dealtHand = dealHand(Math.random);
    dealtHand[dealOrderIndex]!.kept = kept;
    const { getByRole, queryByRole } = render(
      <DealComponentContainer
        createComponent={({
          dealtCards,
          setDealtCards,
        }: {
          dealtCards: readonly DealtCard[];
          setDealtCards: React.Dispatch<
            React.SetStateAction<readonly DealtCard[]>
          >;
        }): JSX.Element => (
          <Card
            dealOrderIndex={dealOrderIndex}
            dealtCards={dealtCards}
            setDealtCards={setDealtCards}
          />
        )}
        dealtHand={dealtHand}
      />,
    );
    return { dealtHand, getByRole, queryByRole };
  };

  it("is a list item", () => {
    const { queryByRole } = dealCreateAndRenderCardContainer({});

    expect(queryByRole("listitem")).toBeTruthy();
  });

  it("text is its rank label", () => {
    const dealOrderIndex = 0;
    const { dealtHand, getByRole } = dealCreateAndRenderCardContainer({
      dealOrderIndex,
    });

    expect(getByRole("listitem").textContent).toBe(
      dealtHand[dealOrderIndex]!.rankLabel,
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
        .classList.contains(className),
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

  const expectKeptAndDiscardedAfterClick = async (kept: boolean) => {
    const user = userEvent.setup();
    const { getByRole } = dealCreateAndRenderCardContainer({ kept });

    await user.click(getByRole("listitem"));

    expect(getByRole("listitem").classList.contains("discarded")).toBe(kept);
  };

  it("has class 'discarded' after being clicked if kept", () =>
    expectKeptAndDiscardedAfterClick(true));

  it("does not have class 'discarded' after being clicked if not kept", () =>
    expectKeptAndDiscardedAfterClick(false));
});
