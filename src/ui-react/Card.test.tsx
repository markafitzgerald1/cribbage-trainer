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
    const { getByRole, getByText, queryByRole } = render(
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
    return { dealtHand, getByRole, getByText, queryByRole };
  };

  it("is a checkbox", () => {
    const { queryByRole } = dealCreateAndRenderCardContainer({});

    expect(queryByRole("checkbox")).toBeTruthy();
  });

  it("label text is its rank", () => {
    const dealOrderIndex = 0;
    const { dealtHand, getByText } = dealCreateAndRenderCardContainer({
      dealOrderIndex,
    });

    expect(getByText(dealtHand[dealOrderIndex]!.rankLabel)).toBeTruthy();
  });

  const expectCardLabelHasClass = ({
    className,
    hasClass,
    kept,
  }: {
    className: string;
    hasClass: boolean;
    kept: boolean;
  }) => {
    const dealOrderIndex = 0;
    const { dealtHand, getByText } = dealCreateAndRenderCardContainer({
      dealOrderIndex,
      kept,
    });
    expect(
      getByText(dealtHand[dealOrderIndex]!.rankLabel).classList.contains(
        className,
      ),
    ).toBe(hasClass);
  };

  it("has class 'card'", () => {
    expectCardLabelHasClass({
      className: "card",
      hasClass: true,
      kept: true,
    });
  });

  it("does not have class 'discarded' when kept", () => {
    expectCardLabelHasClass({
      className: "discarded",
      hasClass: false,
      kept: true,
    });
  });

  it("has class 'discarded' when not kept", () => {
    expectCardLabelHasClass({
      className: "discarded",
      hasClass: true,
      kept: false,
    });
  });

  const expectKeptAndDiscardedAfterClick = async (kept: boolean) => {
    const user = userEvent.setup();
    const dealOrderIndex = 0;
    const { dealtHand, getByRole, getByText } =
      dealCreateAndRenderCardContainer({
        dealOrderIndex,
        kept,
      });

    await user.click(getByRole("checkbox"));

    expect(
      getByText(dealtHand[dealOrderIndex]!.rankLabel).classList.contains(
        "discarded",
      ),
    ).toBe(kept);
  };

  it("has class 'discarded' after being clicked if kept", () =>
    expectKeptAndDiscardedAfterClick(true));

  it("does not have class 'discarded' after being clicked if not kept", () =>
    expectKeptAndDiscardedAfterClick(false));
});
