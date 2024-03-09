import * as classes from "./HandCard.module.css";
import { describe, expect, it, jest } from "@jest/globals";
import { CARD_LABELS } from "../game/Card";
import { DealtCard } from "../game/DealtCard";
import { HandCard } from "./HandCard";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("hand card component", () => {
  const renderCard = (
    { dealOrder, kept, rank }: DealtCard,
    mockOnChange: jest.Mock = jest.fn(),
  ) =>
    render(
      <HandCard
        dealOrderIndex={dealOrder}
        kept={kept}
        onChange={mockOnChange}
        rank={rank}
      />,
    );

  const dealCard = () => dealHand(Math.random)[0]!;

  it("is a checkbox", () =>
    expect(renderCard(dealCard()).queryByRole("checkbox")).toBeTruthy());

  it("label text is its rank label", () => {
    const card = dealCard();
    expect(renderCard(card).getByText(CARD_LABELS[card.rank]!)).toBeTruthy();
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
      getByLabelText(card.rankLabel).parentElement!.classList.contains(
        classes.discarded,
      ),
    ).toBe(!card.kept);
  });
});
