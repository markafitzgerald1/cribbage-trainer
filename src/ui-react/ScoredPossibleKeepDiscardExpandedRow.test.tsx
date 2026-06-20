/* jscpd:ignore-start */
import { Rank, Suit, createCard } from "../game/Card";
import {
  ScoredPossibleKeepDiscardExpandedRow,
  type ScoredPossibleKeepDiscardExpandedRowProps,
} from "./ScoredPossibleKeepDiscardExpandedRow";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { getAllByCardText, queryAllByCardText } from "./test-utils";
import { SortOrder } from "../ui/SortOrder";
/* jscpd:ignore-end */

const MUTED_SELECTOR = '[class*="muted"]';
const SUMMARY_SELECTOR = '[class*="breakdownSummary"]';
const SUMMARY_TOTAL_SELECTOR = '[class*="summaryTotal"]';
const CUT_RESULTS_SELECTOR = '[class*="cutResultsList"]';
const missingCribPointBreakdown = new Map<string, never>().get("missing");
const MUTED_CRIB_CATEGORY_COUNT = 5;
const MUTED_CRIB_CATEGORY_DASHES = Array.from(
  { length: MUTED_CRIB_CATEGORY_COUNT },
  () => "—",
);
const CRIB_STARTER_POINTS = [
  {
    expectedCribPoints: 4.25,
    pointBreakdown: missingCribPointBreakdown,
    remainingStarterCount: 0,
    signedExpectedCribPoints: 4.25,
    starterRank: "A",
    starterSuitRelationPoints: [],
  },
  {
    expectedCribPoints: 5.5,
    pointBreakdown: {
      fifteens: 1,
      flushes: 0.5,
      nobs: 0.25,
      pairs: 2,
      runs: 1.75,
    },
    remainingStarterCount: 4,
    signedExpectedCribPoints: -5.5,
    starterRank: "K",
    starterSuitRelationPoints: [],
  },
] as const;
const CRIB_POINT_BREAKDOWN = {
  fifteens: 0.25,
  flushes: 0.75,
  nobs: 0.5,
  pairs: 1.25,
  runs: 2,
} as const;
const RELATION_CRIB_STARTER_POINTS = [
  {
    expectedCribPoints: 5,
    pointBreakdown: CRIB_POINT_BREAKDOWN,
    remainingStarterCount: 3,
    signedExpectedCribPoints: 5,
    starterRank: "5",
    starterSuitRelationPoints: [
      {
        expectedCribPoints: 6,
        pointBreakdown: {
          fifteens: 1,
          flushes: 0,
          nobs: 0.25,
          pairs: 2,
          runs: 2.75,
        },
        relation: "matching_discard_suit",
        remainingStarterCount: 1,
        starterRank: "5",
        suits: [Suit.DIAMONDS],
      },
      {
        expectedCribPoints: 4.5,
        pointBreakdown: {
          fifteens: 0.5,
          flushes: 0,
          nobs: 0,
          pairs: 1,
          runs: 3,
        },
        relation: "non_matching_discard_suit",
        remainingStarterCount: 2,
        starterRank: "5",
        suits: [Suit.HEARTS, Suit.SPADES],
      },
    ],
  },
] as const;

function getSummaryMutedTexts(container: HTMLElement): Array<string | null> {
  const summary = container.matches(SUMMARY_SELECTOR)
    ? container
    : container.querySelector(SUMMARY_SELECTOR)!;

  return Array.from(
    summary.querySelectorAll(MUTED_SELECTOR),
    (dash) => dash.textContent,
  );
}

function expandStarterDetails() {
  fireEvent.click(screen.getByRole("button", { name: /starter/u }));
}

function expandCribDetails() {
  fireEvent.click(screen.getByRole("button", { name: /Crib avg/u }));
}

function clickSummaryTotal(label: RegExp) {
  const summaryRow = screen.getByRole("button", { name: label });
  const summaryTotal = summaryRow.querySelector(SUMMARY_TOTAL_SELECTOR);

  expect(summaryTotal).toBeTruthy();

  fireEvent.click(summaryTotal as HTMLElement);
}

function expectCardLabelRendered(label: string): void {
  expect(getAllByCardText(screen, label).length).toBeGreaterThan(0);
}

describe("scoredPossibleKeepDiscardExpandedRow", () => {
  const createContribution = (rank: Rank, points: number) => ({
    count: 4,
    cutCard: createCard(rank, "♠"),
    points,
  });

  const MOCK_FIFTEENS_CONTRIBUTIONS = [createContribution(Rank.FIVE, 2)];

  const renderRow = (
    overrides: Partial<ScoredPossibleKeepDiscardExpandedRowProps> = {},
  ) => {
    const a15s = overrides.avgCutAdded15s ?? 0.5;
    const aFlushes = overrides.avgCutAddedFlushes ?? 0;
    const aNobs = overrides.avgCutAddedNobs ?? 0;
    const aPairs = overrides.avgCutAddedPairs ?? 0.1;
    const aRuns = overrides.avgCutAddedRuns ?? 0.2;
    const counts =
      overrides.cutCountsRemaining ?? Array.from({ length: 13 }, () => 4);
    const fifteens = overrides.fifteensContributions ?? [];
    const flushes = overrides.flushesContributions ?? [];
    const handPointsBreakdown = overrides.handPointsBreakdown ?? {
      fifteens: 2,
      flushes: 0,
      nobs: 0,
      pairs: 2,
      runs: 0,
      total: 4,
    };
    const nobs = overrides.nobsContributions ?? [];
    const pairs = overrides.pairsContributions ?? [];
    const runs = overrides.runsContributions ?? [];
    const order = overrides.sortOrder ?? SortOrder.Ascending;
    const expectedCribPointBreakdown =
      "expectedCribPointBreakdown" in overrides
        ? overrides.expectedCribPointBreakdown
        : CRIB_POINT_BREAKDOWN;

    const keep = overrides.keep ?? [];
    const discard = overrides.discard ?? [];

    return render(
      <table>
        <tbody>
          <ScoredPossibleKeepDiscardExpandedRow
            avgCutAdded15s={a15s}
            avgCutAddedFlushes={aFlushes}
            avgCutAddedNobs={aNobs}
            avgCutAddedPairs={aPairs}
            avgCutAddedRuns={aRuns}
            cribStarterPoints={
              overrides.cribStarterPoints ?? CRIB_STARTER_POINTS
            }
            cutCountsRemaining={counts}
            discard={discard}
            expectedCribPointBreakdown={expectedCribPointBreakdown}
            expectedCribPoints={overrides.expectedCribPoints ?? 1.5}
            fifteensContributions={fifteens}
            flushesContributions={flushes}
            handPointsBreakdown={handPointsBreakdown}
            keep={keep}
            nobsContributions={nobs}
            pairsContributions={pairs}
            runsContributions={runs}
            sortOrder={order}
          />
        </tbody>
      </table>,
    );
  };
  const renderExpandedStarterDetails = (
    overrides: Partial<ScoredPossibleKeepDiscardExpandedRowProps> = {},
  ) => {
    renderRow(overrides);
    expandStarterDetails();
  };
  const renderExpandedCribDetails = (
    overrides: Partial<ScoredPossibleKeepDiscardExpandedRowProps> = {},
  ) => {
    renderRow(overrides);
    expandCribDetails();
  };

  it("should render cut results when they exist to satisfy 100% coverage", () => {
    renderExpandedStarterDetails({
      fifteensContributions: MOCK_FIFTEENS_CONTRIBUTIONS,
    });

    expect(screen.getAllByText("0.50").length).toBeGreaterThan(0);

    expectCardLabelRendered("5");
  });

  it("renders zero summary averages as dimmed dashes", () => {
    const { container } = renderRow({
      avgCutAdded15s: 0,
      avgCutAddedFlushes: 0,
      avgCutAddedNobs: 0,
      avgCutAddedPairs: 0,
      avgCutAddedRuns: 0,
      handPointsBreakdown: {
        fifteens: 0,
        flushes: 0,
        nobs: 0,
        pairs: 0,
        runs: 0,
        total: 0,
      },
    });

    expect(getSummaryMutedTexts(container)).toStrictEqual(
      MUTED_CRIB_CATEGORY_DASHES,
    );
    expect(screen.getByText("X")).toBeTruthy();
  });

  it("should render cut results in descending order", () => {
    const fifteensContributions = [
      ...MOCK_FIFTEENS_CONTRIBUTIONS,
      createContribution(Rank.FOUR, 2),
    ];

    renderExpandedStarterDetails({
      fifteensContributions,
      sortOrder: SortOrder.Descending,
    });

    expectCardLabelRendered("5");
    expectCardLabelRendered("4");
  });

  it("should render multiple cut results sorted by points and count", () => {
    const fifteensContributions = [
      ...MOCK_FIFTEENS_CONTRIBUTIONS,
      createContribution(Rank.FOUR, 10),
    ];
    const pairsContributions = [createContribution(Rank.SIX, 2)];

    const customCounts = Array.from({ length: 13 }, () => 4);
    customCounts[Rank.SIX] = 2;

    renderExpandedStarterDetails({
      cutCountsRemaining: customCounts,
      fifteensContributions,
      pairsContributions,
      sortOrder: SortOrder.Descending,
    });

    const cutResults = document.querySelector(CUT_RESULTS_SELECTOR)!;

    expectCardLabelRendered("4");
    expectCardLabelRendered("5");
    expectCardLabelRendered("6");

    expect(screen.getAllByText("10")).toHaveLength(3);

    const allElements = Array.from(cutResults.querySelectorAll("*"));
    const cardLabels = allElements.filter((element) =>
      element.classList.contains("mock-cardLabel"),
    );
    const nonCardLabels = allElements.filter(
      (element) => !element.classList.contains("mock-cardLabel"),
    );

    const matchingCardLabels = cardLabels.filter((element) =>
      element.textContent?.split(/\s+/u).includes("2"),
    );
    const matchingNonCardLabels = nonCardLabels.filter(
      (element) => element.textContent === "2",
    );

    expect([...matchingCardLabels, ...matchingNonCardLabels]).toHaveLength(5);
  });

  it("should cover remaining branches in groupCutsByResults", () => {
    const cutCountsRemaining = Array.from({ length: 13 }, () => 4);
    cutCountsRemaining[Rank.KING] = 0;

    renderExpandedStarterDetails({
      cutCountsRemaining,
      fifteensContributions: MOCK_FIFTEENS_CONTRIBUTIONS,
    });

    expectCardLabelRendered("5");
    expectCardLabelRendered("K");
  });

  it("should cover zero point sorting branches", () => {
    const fifteensContributions = [createContribution(Rank.FIVE, 2)];

    renderExpandedStarterDetails({
      fifteensContributions,
      sortOrder: SortOrder.Descending,
    });

    expectCardLabelRendered("5");

    const fiveLabel = getAllByCardText(screen, "5")[0]!;
    const fourLabel = getAllByCardText(screen, "4")[0]!;

    const FOLLOWING = 4;

    expect(fiveLabel.compareDocumentPosition(fourLabel)).toBe(FOLLOWING);
  });

  it("should keep starter specifics collapsed until the nested expansion opens", () => {
    renderRow({ fifteensContributions: MOCK_FIFTEENS_CONTRIBUTIONS });

    expect(screen.queryByText("5")).toBeNull();
    expect(screen.getByText("Crib avg")).toBeTruthy();

    expandStarterDetails();

    expectCardLabelRendered("5");
  });

  it("toggles starter specifics when clicking anywhere in the summary row", () => {
    renderRow({ fifteensContributions: MOCK_FIFTEENS_CONTRIBUTIONS });

    clickSummaryTotal(/Hand starter/u);

    expectCardLabelRendered("5");

    clickSummaryTotal(/Hand starter/u);

    expect(screen.queryByText("5")).toBeNull();
  });

  it("toggles crib specifics when clicking anywhere in the summary row", () => {
    renderRow();

    clickSummaryTotal(/Crib avg/u);

    expect(screen.getByText("K")).toBeTruthy();

    clickSummaryTotal(/Crib avg/u);

    expect(screen.queryByText("K")).toBeNull();
  });

  it("renders crib averages as unsigned local crib values", () => {
    renderExpandedCribDetails({
      expectedCribPoints: 1.5,
    });

    expect(screen.queryByText("A")).toBeNull();
    expect(screen.getByText("K")).toBeTruthy();
    expect(screen.getByText("1.50")).toBeTruthy();
    expect(screen.getByText("5.50")).toBeTruthy();
    expect(screen.queryByText("-5.50")).toBeNull();
  });

  it("renders crib point-type averages from v2 buckets", () => {
    renderRow({
      expectedCribPointBreakdown: CRIB_POINT_BREAKDOWN,
      expectedCribPoints: 4.75,
    });

    expect(document.body.textContent).toStrictEqual(
      expect.stringContaining("0.251.252.000.750.504.75"),
    );
  });

  it("renders total-only crib details when point buckets are unavailable", () => {
    renderRow({
      expectedCribPointBreakdown: missingCribPointBreakdown,
      expectedCribPoints: 4.75,
    });
    const cribSummary = screen
      .getByText("Crib avg")
      .closest(SUMMARY_SELECTOR) as HTMLElement;

    expect(screen.getByText("4.75")).toBeTruthy();
    expect(getSummaryMutedTexts(cribSummary)).toStrictEqual(
      MUTED_CRIB_CATEGORY_DASHES,
    );
  });

  it("renders suited starter relation rows instead of the root rank row", () => {
    renderExpandedCribDetails({
      cribStarterPoints: RELATION_CRIB_STARTER_POINTS,
    });

    expectCardLabelRendered("5♦");
    expectCardLabelRendered("5 (♥♠)");

    expect(screen.getByText("6.00")).toBeTruthy();
    expect(screen.getByText("4.50")).toBeTruthy();
    expect(getAllByCardText(screen, "5")).toHaveLength(2);
  });

  it("renders ordinary starter rows when relation rows are absent", () => {
    renderExpandedCribDetails({
      cribStarterPoints: [
        {
          ...RELATION_CRIB_STARTER_POINTS[0],
          starterSuitRelationPoints: [],
        },
      ],
    });

    expectCardLabelRendered("5");

    expect(queryAllByCardText(screen, "5♦")).toHaveLength(0);
    expect(screen.getByText("5.00")).toBeTruthy();
  });
});
