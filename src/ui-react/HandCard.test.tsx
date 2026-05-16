import * as classes from "./HandCard.module.css";
import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { CARD_LABELS } from "../game/Card";
import type { DealtCard } from "../game/DealtCard";
import { HandCard } from "./HandCard";
import { dealHand } from "../game/dealHand";
import { getByCardText } from "./test-utils";
import userEvent from "@testing-library/user-event";
/* jscpd:ignore-end */

const getLabel = ({
  getByRole,
}: {
  getByRole: (role: string) => HTMLElement;
}) => getByRole("checkbox").closest("label")!;

describe("hand card component", () => {
  const renderCard = (
    { dealOrder, kept, rank, suit }: DealtCard,
    mockOnChange: jest.Mock = jest.fn(),
  ) =>
    render(
      <HandCard
        dealOrderIndex={dealOrder}
        kept={kept}
        onChange={mockOnChange}
        rank={rank}
        suit={suit}
      />,
    );

  const dealCard = () => dealHand(Math.random)[0]!;

  it("is a checkbox", () =>
    expect(renderCard(dealCard()).queryByRole("checkbox")).toBeTruthy());

  it("label text is its rank label", () => {
    const card = dealCard();
    renderCard(card);

    expect(
      getByCardText(screen, `${CARD_LABELS[card.rank]}${card.suit}`),
    ).toBeTruthy();
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
    const label = getLabel(renderCard(card, mock));

    await user.click(label);

    expect(mock).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(`%s has class 'discarded' if not kept`, (kept) => {
    const card = { ...dealCard(), kept };

    expect(
      getLabel(renderCard(card)).classList.contains(classes.discarded),
    ).toBe(!card.kept);
  });
});
