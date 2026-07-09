/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { CARDS, DECK } from "../game/Card";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { CardGridPicker } from "./CardGridPicker";
/* jscpd:ignore-end */

const renderPicker = (selectedCards = DECK.slice(0, 6)) => {
  const onToggle = jest.fn();
  const rendered = render(
    <CardGridPicker
      onToggle={onToggle}
      selectedCards={selectedCards}
      selectionFull={selectedCards.length === 6}
    />,
  );
  return { onToggle, rendered };
};

describe("card grid picker", () => {
  it("renders all physical cards", () => {
    const { rendered } = renderPicker([]);

    expect(rendered.getAllByRole("button")).toHaveLength(52);
  });

  it("renders suit columns in hand sort order", () => {
    const { rendered } = renderPicker([]);
    const cardNames = rendered
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label"));

    expect(cardNames.slice(0, 15)).toStrictEqual([
      "A♠",
      "2♠",
      "3♠",
      "4♠",
      "5♠",
      "6♠",
      "7♠",
      "8♠",
      "9♠",
      "10♠",
      "J♠",
      "Q♠",
      "K♠",
      "A♥",
      "2♥",
    ]);
  });

  it("reports a selected card for deselection", () => {
    const { onToggle, rendered } = renderPicker([CARDS.ACE]);

    fireEvent.click(
      rendered.getByRole("button", { name: "A♣", pressed: true }),
    );

    expect(onToggle).toHaveBeenCalledWith(CARDS.ACE);
  });

  it("reports an available card for selection", () => {
    const { onToggle, rendered } = renderPicker([]);

    fireEvent.click(rendered.getByRole("button", { name: "A♣" }));

    expect(onToggle).toHaveBeenCalledWith(CARDS.ACE);
  });

  it("disables only unselected cards when selection is full", () => {
    const { rendered } = renderPicker();

    expect(
      rendered.getByRole("button", { name: "A♣", pressed: true }),
    ).toBeEnabled();
    expect(rendered.getByRole("button", { name: "7♣" })).toBeDisabled();
  });
});
