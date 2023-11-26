import * as classes from "./Card.module.css";
import { describe, expect, it, jest } from "@jest/globals";
import { CARDS } from "../game/Card";
import { Card as CardComponent } from "./Card";
import { DealtCard } from "../game/DealtCard";
import React from "react";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("card component", () => {
  const renderCard = (
    { dealOrder, kept, rankLabel }: DealtCard,
    mockOnChange: jest.Mock = jest.fn(),
  ) =>
    render(
      <CardComponent
        dealOrderIndex={dealOrder}
        kept={kept}
        onChange={mockOnChange}
        rankLabel={rankLabel}
      />,
    );

  const dealCard = () => dealHand(Math.random)[0]!;

  it("is a checkbox", () =>
    expect(renderCard(dealCard()).queryByRole("checkbox")).toBeTruthy());

  it("label text is its rank label", () => {
    const card = dealCard();
    expect(renderCard(card).getByText(card.rankLabel)).toBeTruthy();
  });

  it("emits an onChange event on checkbox click", async () => {
    const user = userEvent.setup();
    const mock = jest.fn();
    const { getByRole } = renderCard(dealCard(), mock);

    await user.click(getByRole("checkbox"));

    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("emits an onChange event on label click", async () => {
    const user = userEvent.setup();
    const card = dealCard();
    const mock = jest.fn();
    const { getByLabelText } = renderCard(card, mock);

    await user.click(getByLabelText(card.rankLabel));

    expect(mock).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(`%s has class 'discarded' if not kept`, (kept) => {
    const card = { ...dealCard(), kept };
    const { getByLabelText } = renderCard(card);

    expect(
      getByLabelText(card.rankLabel)
        .closest("div")!
        .classList.contains(classes.discarded),
    ).toBe(!card.kept);
  });

  it.each([CARDS.TEN, CARDS.FOUR])(
    "%s has the 'ten' CSS class if it is a ten",
    (card) => {
      const dealtCard = { ...dealCard(), rankLabel: card.rankLabel };
      const { getByLabelText } = renderCard(dealtCard);

      expect(
        getByLabelText(dealtCard.rankLabel)
          .closest("div")!
          .classList.contains(classes.ten),
      ).toBe(dealtCard.rankLabel === CARDS.TEN.rankLabel);
    },
  );
});
