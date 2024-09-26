import { describe, expect, it } from "@jest/globals";
import { CARDS } from "../game/Card";
import { PossibleHandCard } from "./PossibleHandCard";
import { render } from "@testing-library/react";

describe("possible hand card component", () => {
  it("renders a <span>", () => {
    expect(
      render(
        <PossibleHandCard rank={CARDS.ACE.rank} />,
      ).container.querySelector("span"),
    ).toBeTruthy();
  });

  it.each([CARDS.ACE, CARDS.FIVE, CARDS.QUEEN])(
    "renders a <span> with %s",
    (card) => {
      const spanElement = render(
        <PossibleHandCard rank={card.rank} />,
      ).container.querySelector("span");

      expect(spanElement!.textContent).toBe(card.rankLabel);
    },
  );
});
