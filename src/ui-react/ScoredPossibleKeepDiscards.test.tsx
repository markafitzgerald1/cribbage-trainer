/* jscpd:ignore-start */
import { Rank, createCard, parseHand } from "../game/Card";
import { describe, expect, it, jest } from "@jest/globals";
import {
  expectedCribPointsTable,
  expectedPlayPointsTable,
} from "../analysis/analysis.test.common";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CARDS_PER_DISCARD } from "../game/facts";
import { Combination } from "js-combinatorics";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { deferredUncertainty } from "../game/uncertaintySidecar.test.common";
import { setTableSync as setPlayTableSync } from "../game/expectedPlayPointsTableLoader";
import { setTableSync } from "../game/expectedCribPointsTableLoader";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

const mockLoadCribTable = jest.fn(() => {
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
      loadTable: () => mockLoadCribTable(),
    };
  },
);

const REPORTED_HAND = "AH,2H,3H,4H,5H,6H";

const REPORTED_ANALYSIS_CASES = [
  {
    cribRole: CribRole.Pone,
    discards: parseHand("AH,2H"),
    expected: {
      cribRole: CribRole.Pone,
      oppositeRoleExpectedPointsLoss: expect.any(Number),
      quality: {
        expectedPointsLoss: expect.any(Number),
        isOptimal: expect.any(Boolean),
      },
    },
    name: "the role and what the chosen discard gave up",
  },
  {
    cribRole: CribRole.Dealer,
    discards: null,
    // Every option's keep is entirely kept until two cards are discarded, so a quality here would be the top-ranked option's, not the user's.
    expected: {
      cribRole: CribRole.Dealer,
      oppositeRoleExpectedPointsLoss: null,
      quality: null,
    },
    name: "no decision quality until two cards are discarded",
  },
];

// Ranking, sorting and reporting: no bound involved, so state it is absent rather than parse 1.2 MB per case.
const noUncertainty = deferredUncertainty(null);

const mathRandom = Math.random;

interface RenderOptions {
  readonly cribRole?: CribRole;
  readonly onAnalysisRendered?: (analysis: RenderedAnalysis) => void;
  readonly onScoreSortKeyChange?: (
    scoreSortKey: ScoredKeepDiscardSortKey,
  ) => void;
  readonly preload?: boolean;
  readonly scoreSortKey?: ScoredKeepDiscardSortKey;
}

const renderScoredPossibleKeepDiscards = (
  dealtCards: DealtCard[],
  {
    cribRole = CribRole.Dealer,
    onAnalysisRendered = jest.fn(),
    onScoreSortKeyChange = jest.fn(),
    preload = true,
    scoreSortKey = ScoredKeepDiscardSortKey.ExpectedNetPoints,
  }: RenderOptions = {},
) => {
  if (preload) {
    setTableSync(expectedCribPointsTable);
    setPlayTableSync(expectedPlayPointsTable);
  }

  return render(
    <ScoredPossibleKeepDiscards
      cribRole={cribRole}
      cribUncertaintySource={noUncertainty}
      dealtCards={dealtCards}
      onAnalysisRendered={onAnalysisRendered}
      onScoreSortKeyChange={onScoreSortKeyChange}
      playUncertaintySource={noUncertainty}
      scoreSortKey={scoreSortKey}
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
      const cellText = row.cells.item(cellIndex)?.textContent?.replace("▸", "");

      return Number(cellText);
    },
  );

const renderPoneAnalysis = (cards: string, discards: string) =>
  renderScoredPossibleKeepDiscards(
    toDealtCards(parseHand(cards), parseHand(discards)),
    { cribRole: CribRole.Pone },
  );

describe("scored possible keep discards component", () => {
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

  it("labels the net column with the net expected points sort", () => {
    renderScoredPossibleKeepDiscards(dealHand(mathRandom), {
      cribRole: CribRole.Pone,
    });

    expect(
      screen.getByRole("button", { name: "Net: Sort by net expected points" }),
    ).toBeTruthy();
  });

  it.each([
    { cellIndex: 1, scoreSortKey: ScoredKeepDiscardSortKey.ExpectedHandPoints },
    { cellIndex: 2, scoreSortKey: ScoredKeepDiscardSortKey.ExpectedCribPoints },
    { cellIndex: 3, scoreSortKey: ScoredKeepDiscardSortKey.ExpectedPlayPoints },
    { cellIndex: 4, scoreSortKey: ScoredKeepDiscardSortKey.ExpectedNetPoints },
  ])(
    "sorts rows by the $scoreSortKey score sort key prop",
    ({ cellIndex, scoreSortKey }) => {
      expect.hasAssertions();

      const { container } = renderScoredPossibleKeepDiscards(
        dealHand(mathRandom),
        { scoreSortKey },
      );

      const values = getColumnValues(container, cellIndex);

      expect(values).toStrictEqual(
        [...values].sort((left, right) => right - left),
      );
    },
  );

  it.each([
    {
      headerName: /^Hand:/u,
      scoreSortKey: ScoredKeepDiscardSortKey.ExpectedHandPoints,
    },
    {
      headerName: /^Crib:/u,
      scoreSortKey: ScoredKeepDiscardSortKey.ExpectedCribPoints,
    },
    {
      headerName: /^Play:/u,
      scoreSortKey: ScoredKeepDiscardSortKey.ExpectedPlayPoints,
    },
    {
      headerName: /^Net:/u,
      scoreSortKey: ScoredKeepDiscardSortKey.ExpectedNetPoints,
    },
  ])(
    "notifies the change handler with $scoreSortKey when the $headerName header is clicked",
    ({ headerName, scoreSortKey }) => {
      expect.hasAssertions();

      const onScoreSortKeyChange = jest.fn();
      renderScoredPossibleKeepDiscards(dealHand(mathRandom), {
        onScoreSortKeyChange,
      });

      fireEvent.click(screen.getByRole("button", { name: headerName }));

      expect(onScoreSortKeyChange).toHaveBeenCalledWith(scoreSortKey);
    },
  );

  const renderAndExpectLoading = (onAnalysisRendered = jest.fn()) => {
    setTableSync(null);
    setPlayTableSync(null);

    renderScoredPossibleKeepDiscards(dealHand(mathRandom), {
      onAnalysisRendered,
      preload: false,
    });

    expect(screen.getByText("Loading analysis...")).toBeTruthy();
  };

  const renderFailedLoad = async (onAnalysisRendered = jest.fn()) => {
    mockLoadCribTable.mockRejectedValueOnce(new Error("Fake load error"));

    renderAndExpectLoading(onAnalysisRendered);

    await waitFor(() => {
      expect(screen.getByText("Failed to load analysis.")).toBeTruthy();
    });
  };

  const expectLoaded = async () => {
    await waitFor(() => {
      expect(screen.queryByText("Loading analysis...")).toBeNull();
    });
    return screen.getByRole("table");
  };

  it("reports a rendered analysis once the ranked results are on screen", () => {
    const onAnalysisRendered = jest.fn();
    renderScoredPossibleKeepDiscards(dealHand(mathRandom), {
      onAnalysisRendered,
    });

    expect(onAnalysisRendered).toHaveBeenCalledTimes(1);
  });

  it.each(REPORTED_ANALYSIS_CASES)(
    "reports $name",
    ({ cribRole, discards, expected }) => {
      const onAnalysisRendered =
        jest.fn<(analysis: RenderedAnalysis) => void>();
      renderScoredPossibleKeepDiscards(
        toDealtCards(parseHand(REPORTED_HAND), discards),
        { cribRole, onAnalysisRendered },
      );

      expect(onAnalysisRendered).toHaveBeenCalledWith(expected);
    },
  );

  it("reports no rendered analysis while the tables are still loading", () => {
    const onAnalysisRendered = jest.fn();
    renderAndExpectLoading(onAnalysisRendered);

    expect(onAnalysisRendered).not.toHaveBeenCalled();
  });

  it("reports no rendered analysis when the load fails", async () => {
    const onAnalysisRendered = jest.fn();
    await renderFailedLoad(onAnalysisRendered);

    expect(onAnalysisRendered).not.toHaveBeenCalled();
  });

  it("renders loading state when table is not loaded, then renders content once loaded", async () => {
    renderAndExpectLoading();

    await expect(expectLoaded()).resolves.toBeTruthy();
  });

  it("handles loading error gracefully and allows retry", async () => {
    await renderFailedLoad();

    const retryButton = screen.getByRole("button", { name: "Retry" });

    // Now mock a successful load for retry
    mockLoadCribTable.mockResolvedValueOnce(expectedCribPointsTable);

    // Click retry
    fireEvent.click(retryButton);

    // Eventually should render content

    await expect(expectLoaded()).resolves.toBeTruthy();
  });

  describe("caption diagnostics and optimal margin", () => {
    it.each([
      {
        cards: "5H,5D,6H,7H,8H,9H",
        discards: "5H,5D",
        expectedAriaLabel: "Optimal discard, 4.05 better than next",
        expectedMarkedTexts: [],
        expectedText: "Optimal, 4.05 better than next",
        name: "optimal discard caption when chosen discard is optimal",
      },
      {
        cards: "9D,9C,9H,4C,4H,3S",
        cribRole: CribRole.Pone,
        discards: "3S,9C",
        expectedAriaLabel: "Optimal discard, 0.37 better than next distinct",
        expectedMarkedTexts: [],
        expectedText: "Optimal, 0.37 better than next distinct",
        name: "optimal discard caption when top choices tie",
      },
      {
        cards: "4H,5D,KH,6H,8C,KC",
        cribRole: CribRole.Dealer,
        discards: "KH,KC",
        expectedAriaLabel:
          "Sub-optimal: 0.09 points lost. 1.31 Crib and 0.08 Play gain do not cover 1.48 Hand loss",
        expectedMarkedTexts: [],
        /*
         * The reversed role would have cost 3.12 here against the 0.09 the
         * role held cost, so naming it would tell the reader only that they
         * were nearly right and would have been more wrong as pone. One
         * figure, and the diagnostic reason beside it.
         */
        expectedText:
          "Sub-optimal: 0.09 pts lost1.31 Crib + 0.08 Play gain < 1.48 Hand loss",
        name: "sub-optimal caption withholding a reversed role that cost more",
      },
      {
        cards: "9D,9C,9H,4C,4H,3S",
        cribRole: CribRole.Dealer,
        discards: "9D,3S",
        expectedAriaLabel:
          "Sub-optimal: 3.11 points lost as dealer, 0.00 as pone. 0.64 Play gain does not cover 2.05 Crib and 1.70 Hand loss",
        expectedMarkedTexts: ["0.00 as pone"],
        expectedText:
          "Sub-optimal: 3.11 as dealer, 0.00 as pone0.64 Play gain < 2.05 Crib + 1.70 Hand loss",
        name: "a zero cost under the reversed role stated as a figure, not as a diagnosis",
      },
    ])(
      "renders $name",
      ({
        cards,
        cribRole = CribRole.Dealer,
        discards,
        expectedAriaLabel,
        expectedMarkedTexts,
        expectedText,
      }) => {
        const dealtCards = toDealtCards(parseHand(cards), parseHand(discards));
        const { container } = renderScoredPossibleKeepDiscards(dealtCards, {
          cribRole,
        });
        const caption = container.querySelector("figcaption");

        expect(caption?.getAttribute("role")).toBe("status");
        expect(caption?.getAttribute("aria-label")).toBe(expectedAriaLabel);
        expect(caption?.textContent).toBe(expectedText);
        // Mocked CSS modules render the class as mock-<name>; only a reversed-role figure that cost nothing carries it.
        expect(
          Array.from(
            container.querySelectorAll(".mock-costsNothing"),
            (element) => element.textContent,
          ),
        ).toStrictEqual(expectedMarkedTexts);
      },
    );
  });

  describe("highlight tiers", () => {
    it("marks all three tied discards when three discards tie for best, with chosen row highlighted and accessible descriptions outside cells", () => {
      const { container } = renderPoneAnalysis("9D,9C,9H,4C,4H,3S", "3S,9C");
      const rows = Array.from(
        container.querySelectorAll<HTMLTableRowElement>("tbody tr"),
      );
      const rowSummaries = rows.slice(0, 4).map((row) => ({
        describedBy: row.getAttribute("aria-describedby"),
        hasHighlightedClass: row.className.includes("highlighted"),
        tier: row.getAttribute("data-highlight-tier"),
      }));

      expect(rowSummaries).toStrictEqual([
        {
          describedBy: "scored-discard-0-description",
          hasHighlightedClass: true,
          tier: "chosen",
        },
        {
          describedBy: "scored-discard-1-description",
          hasHighlightedClass: false,
          tier: "equal-best",
        },
        {
          describedBy: "scored-discard-2-description",
          hasHighlightedClass: false,
          tier: "equal-best",
        },
        {
          describedBy: null,
          hasHighlightedClass: false,
          tier: "none",
        },
      ]);

      // Ensure no description spans exist inside table cells (preventing double announcement)
      const cellIds = screen
        .getAllByRole("cell")
        .flatMap((cell) => Array.from(cell.querySelectorAll("[id]")));

      expect(cellIds).toHaveLength(0);

      // Verify description elements outside table
      const descriptions = [0, 1, 2].map(
        (index) =>
          container.querySelector(`#scored-discard-${index}-description`)
            ?.textContent,
      );

      expect(descriptions).toStrictEqual([
        "Optimal discard",
        "Equal-best discard",
        "Equal-best discard",
      ]);
    });

    it("marks chosen sub-optimal row as chosen and all tied top rows as equal-best", () => {
      renderPoneAnalysis("9D,9C,9H,4C,4H,3S", "9D,9C");
      const rows = screen.getAllByRole("row").slice(1);
      const chosenRow = rows.find(
        (row) => row.getAttribute("data-highlight-tier") === "chosen",
      );
      const equalBestRows = rows.filter(
        (row) => row.getAttribute("data-highlight-tier") === "equal-best",
      );
      const equalBestTiersAndTitles = equalBestRows.map((row) => ({
        hasEqualBestClass: row.className.includes("equalBest"),
        title: row.getAttribute("title"),
      }));

      expect(chosenRow?.className).toContain("highlighted");
      expect(equalBestRows).toHaveLength(3);
      expect(equalBestTiersAndTitles).toStrictEqual([
        { hasEqualBestClass: true, title: "Equal-best discard" },
        { hasEqualBestClass: true, title: "Equal-best discard" },
        { hasEqualBestClass: true, title: "Equal-best discard" },
      ]);
    });
  });

  it("renders gain and loss sides in separate diagnosticSide inline elements", () => {
    const dealtCards = toDealtCards(
      parseHand("4H,5D,KH,6H,8C,KC"),
      parseHand("KH,KC"),
    );
    const { container } = renderScoredPossibleKeepDiscards(dealtCards);
    const sides = container.querySelectorAll("span[class*='diagnosticSide']");

    expect(sides).toHaveLength(2);
    expect(sides[0]?.textContent).toBe("1.31 Crib + 0.08 Play gain");
    expect(sides[1]?.textContent).toBe("< 1.48 Hand loss");
  });

  it("renders a single diagnosticSide element when there are no offsetting gains", () => {
    const cards = parseHand("5H,5D,JC,QH,KS,9D");
    const dealtCards = toDealtCards(cards, parseHand("5H,5D"));
    const { container } = renderScoredPossibleKeepDiscards(dealtCards, {
      cribRole: CribRole.Pone,
    });
    const sides = container.querySelectorAll("span[class*='diagnosticSide']");

    expect(sides).toHaveLength(1);
    expect(sides[0]?.textContent).toBe(
      "7.57 Hand + 5.18 Crib + 0.53 Play loss",
    );
  });

  it("renders empty table body when no candidates exist", () => {
    const { container } = renderScoredPossibleKeepDiscards([]);

    expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
  });
});
