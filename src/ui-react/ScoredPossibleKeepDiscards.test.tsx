/* jscpd:ignore-start */
import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import { Rank, createCard } from "../game/Card";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CARDS_PER_DISCARD } from "../game/facts";
import { Combination } from "js-combinatorics";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import expectedCribPointsTableData from "../game/expectedCribPointsTable.json";
import { setTableSync } from "../game/expectedCribPointsTableLoader";
/* jscpd:ignore-end */

const mockLoadTable = jest.fn(() => {
  const actualLoader = jest.requireActual<
    typeof import("../game/expectedCribPointsTableLoader")
  >("../game/expectedCribPointsTableLoader");
  return actualLoader.loadTable();
});

jest.mock<typeof import("../game/expectedCribPointsTableLoader")>(
  "../game/expectedCribPointsTableLoader",
  () => {
    const actual = jest.requireActual<
      typeof import("../game/expectedCribPointsTableLoader")
    >("../game/expectedCribPointsTableLoader");
    return {
      ...actual,
      loadTable: () => mockLoadTable(),
    };
  },
);

describe("scored possible keep discards component", () => {
  const mathRandom = Math.random;

  const renderScoredPossibleKeepDiscards = (
    dealtCards: DealtCard[],
    cribRole: CribRole = CribRole.Dealer,
    preload = true,
  ) => {
    if (preload) {
      setTableSync(
        expectedCribPointsTableData as unknown as ExpectedCribPointsTable,
      );
    }

    return render(
      <ScoredPossibleKeepDiscards
        cribRole={cribRole}
        dealtCards={dealtCards}
        sortOrder={SortOrder.Ascending}
      />,
    );
  };

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

  const renderAndExpectLoading = () => {
    setTableSync(null);

    renderScoredPossibleKeepDiscards(
      dealHand(mathRandom),
      CribRole.Dealer,
      false,
    );

    expect(screen.getByText("Loading analysis...")).toBeTruthy();
  };

  const expectLoaded = async () => {
    await waitFor(() => {
      expect(screen.queryByText("Loading analysis...")).toBeNull();
    });
    return screen.getByRole("table");
  };

  it("renders loading state when table is not loaded, then renders content once loaded", async () => {
    renderAndExpectLoading();

    await expect(expectLoaded()).resolves.toBeTruthy();
  });

  it("handles loading error gracefully and allows retry", async () => {
    mockLoadTable.mockRejectedValueOnce(new Error("Fake load error"));

    renderAndExpectLoading();

    await waitFor(() => {
      expect(screen.getByText("Failed to load analysis.")).toBeTruthy();
    });

    const retryButton = screen.getByRole("button", { name: "Retry" });

    // Now mock a successful load for retry
    mockLoadTable.mockResolvedValueOnce(
      expectedCribPointsTableData as unknown as ExpectedCribPointsTable,
    );

    // Click retry
    fireEvent.click(retryButton);

    // Eventually should render content

    await expect(expectLoaded()).resolves.toBeTruthy();
  });
});
