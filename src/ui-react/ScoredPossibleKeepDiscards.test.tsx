import { describe, expect, it } from "@jest/globals";
import { CARDS_PER_DISCARD } from "../game/facts";
import { Combination } from "js-combinatorics";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
/* jscpd:ignore-start */
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";
/* jscpd:ignore-end */

describe("scored possible keep discards component", () => {
  const mathRandom = Math.random;

  const dealAndRender = () => {
    const dealtHand = dealHand(mathRandom);

    const { container } = render(
      <ScoredPossibleKeepDiscards
        dealtCards={dealtHand}
        sortOrder={SortOrder.Ascending}
      />,
    );

    return { container, dealtHand };
  };

  it("has column headers for Keep, Discard, Pre-Cut, From Cut, and Total", () => {
    const { container } = dealAndRender();

    expect(container.textContent).toContain("Keep");
    expect(container.textContent).toContain("Discard");
    expect(container.textContent).toContain("Pre-Cut");
    expect(container.textContent).toContain("From Cut");
    expect(container.textContent).toContain("Total");
  });

  it("should render each possible keep and discard pair exactly once", () => {
    const { container } = dealAndRender();

    const nCombs = Number(
      new Combination(dealHand(mathRandom), CARDS_PER_DISCARD).length,
    );

    expect(container.querySelectorAll("li")).toHaveLength(nCombs);
  });
});
