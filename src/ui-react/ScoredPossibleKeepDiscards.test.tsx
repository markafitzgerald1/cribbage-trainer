/* jscpd:ignore-start */
import { Rank, createCard } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { CARDS_PER_DISCARD } from "../game/facts";
import { Combination } from "js-combinatorics";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
/* jscpd:ignore-end */

describe("scored possible keep discards component", () => {
  const mathRandom = Math.random;

  const renderScoredPossibleKeepDiscards = (
    dealtCards: DealtCard[],
    cribRole: CribRole = CribRole.Dealer,
  ) =>
    render(
      <ScoredPossibleKeepDiscards
        cribRole={cribRole}
        dealtCards={dealtCards}
        sortOrder={SortOrder.Ascending}
      />,
    );

  const dealAndRender = () => {
    const dealtHand = dealHand(mathRandom);
    const { container } = renderScoredPossibleKeepDiscards(dealtHand);

    return { container, dealtHand };
  };
  const getColumnValues = (container: HTMLElement, cellIndex: number) =>
    Array.from(container.querySelectorAll<HTMLTableRowElement>("tbody tr")).map(
      (row) => {
        const cellText = row.cells
          .item(cellIndex)
          ?.textContent?.replace("▸", "");

        return Number(cellText);
      },
    );

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
      ...createCard(card.rank, "♠"),
      dealOrder: card.dealOrder,
      kept: card.kept,
    }));

    const { container } = renderScoredPossibleKeepDiscards(
      handWithDuplicateFives,
    );

    // Use mock-highlighted because CSS modules are mocked
    const highlightedRows = container.querySelectorAll(".mock-highlighted");

    expect(highlightedRows).toHaveLength(1);
  });

  it("renders the pone net column as hand minus crib", () => {
    renderScoredPossibleKeepDiscards(dealHand(mathRandom), CribRole.Pone);

    expect(screen.getByRole("button", { name: /E\(h-c\)/u })).toBeTruthy();
  });

  it.each([
    { cellIndex: 1, headerName: /E\(h\)/u },
    { cellIndex: 2, headerName: /E\(c\)/u },
    { cellIndex: 3, headerName: /E\(h\+c\)/u },
  ])(
    "sorts rows by $headerName when the score header is clicked",
    ({ cellIndex, headerName }) => {
      expect.hasAssertions();

      const { container } = dealAndRender();

      fireEvent.click(screen.getByRole("button", { name: headerName }));

      const values = getColumnValues(container, cellIndex);

      expect(values).toStrictEqual(
        [...values].sort((left, right) => right - left),
      );
    },
  );
});
