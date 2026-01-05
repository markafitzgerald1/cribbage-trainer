import { Rank, createCard } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { CARDS_PER_DISCARD } from "../game/facts";
import { Combination } from "js-combinatorics";
/* jscpd:ignore-start */
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
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

  it("should render each possible keep and discard pair exactly once", () => {
    const { container } = dealAndRender();

    const nCombs = Number(
      new Combination(dealHand(mathRandom), CARDS_PER_DISCARD).length,
    );

    expect(container.querySelectorAll("tbody tr")).toHaveLength(nCombs);
  });

  it("should highlight exactly one row when hand contains duplicate ranks", () => {
    const handWithDuplicateFives = [
      { dealOrder: 0, kept: true, rank: Rank.FIVE },
      { dealOrder: 1, kept: false, rank: Rank.FIVE },
      { dealOrder: 2, kept: true, rank: Rank.SIX },
      { dealOrder: 3, kept: true, rank: Rank.SEVEN },
      { dealOrder: 4, kept: true, rank: Rank.EIGHT },
      { dealOrder: 5, kept: false, rank: Rank.NINE },
    ].map((card) => ({
      ...createCard(card.rank),
      dealOrder: card.dealOrder,
      kept: card.kept,
    }));

    const { container } = render(
      <ScoredPossibleKeepDiscards
        dealtCards={handWithDuplicateFives}
        sortOrder={SortOrder.Ascending}
      />,
    );

    // Use mock-highlighted because CSS modules are mocked
    const highlightedRows = container.querySelectorAll(".mock-highlighted");

    expect(highlightedRows).toHaveLength(1);
  });
});
