/* jscpd:ignore-start */
import { Rank, createCard } from "../game/Card";
import {
  ScoredPossibleKeepDiscardExpandedRow,
  type ScoredPossibleKeepDiscardExpandedRowProps,
} from "./ScoredPossibleKeepDiscardExpandedRow";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { SortOrder } from "../ui/SortOrder";
import { getAllByCardText } from "./test-utils";
/* jscpd:ignore-end */

const MUTED_SELECTOR = '[class*="muted"]';
const SUMMARY_SELECTOR = '[class*="breakdownSummary"]';
const CUT_RESULTS_SELECTOR = '[class*="cutResultsList"]';
const STARTER_AVG_TEXT = /^Starter avg/u;

function getSummaryMutedTexts(container: HTMLElement): Array<string | null> {
  const summary = container.querySelector(SUMMARY_SELECTOR)!;

  return Array.from(
    summary.querySelectorAll(MUTED_SELECTOR),
    (dash) => dash.textContent,
  );
}

function expandStarterDetails() {
  fireEvent.click(screen.getByText(STARTER_AVG_TEXT));
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
            cutCountsRemaining={counts}
            discard={discard}
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

  it("should render cut results when they exist to satisfy 100% coverage", () => {
    renderExpandedStarterDetails({
      fifteensContributions: MOCK_FIFTEENS_CONTRIBUTIONS,
    });

    // Verify the breakdown summary and CutResultRow for rank 5 are rendered.
    // All 4 fives share the same score, so they are grouped as rank-only "5".
    expect(screen.getByText("0.50")).toBeTruthy();

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

    expect(getSummaryMutedTexts(container)).toStrictEqual([
      "—",
      "—",
      "—",
      "—",
      "—",
    ]);
    expect(screen.getByText("X")).toBeTruthy();
  });

  it("should render cut results in descending order", () => {
    // Provide two contributions to verify sorting/grouping
    const fifteensContributions = [
      ...MOCK_FIFTEENS_CONTRIBUTIONS,
      createContribution(Rank.FOUR, 2),
    ];

    renderExpandedStarterDetails({
      fifteensContributions,
      sortOrder: SortOrder.Descending,
    });

    // Verify that both ranks are rendered (collapsed to rank-only)
    expectCardLabelRendered("5");
    expectCardLabelRendered("4");
  });

  it("should render multiple cut results sorted by points and count", () => {
    // Provide contributions to cover all sorting branches in groupCutsByResults
    const fifteensContributions = [
      ...MOCK_FIFTEENS_CONTRIBUTIONS,
      createContribution(Rank.FOUR, 10),
    ];
    const pairsContributions = [createContribution(Rank.SIX, 2)];

    // To cover line 69 (same points, different count),
    // We need to manipulate cutCountsRemaining for one of the ranks
    const customCounts = Array.from({ length: 13 }, () => 4);
    // Different count than Rank.FIVE
    customCounts[Rank.SIX] = 2;

    renderExpandedStarterDetails({
      cutCountsRemaining: customCounts,
      fifteensContributions,
      pairsContributions,
      sortOrder: SortOrder.Descending,
    });

    const cutResults = document.querySelector(CUT_RESULTS_SELECTOR)!;

    // Verify rendering (collapsed to rank-only)
    expectCardLabelRendered("4");
    expectCardLabelRendered("5");
    expectCardLabelRendered("6");

    // "10" appears 3 times: 15sPoints column, totalPoints, and rank 10 label.
    expect(screen.getAllByText("10")).toHaveLength(3);

    // "2" appears several times in the starter detail:
    // - Rank 5 row: 15sPoints (2) and totalPoints (2)
    // - Rank 6 row: pairsPoints (2) and totalPoints (2)
    // - Rank 2 card label text node (inside a grouped label)
    // We search for elements that are exactly "2" (points)
    // Or CardLabels that contain "2" among their ranks.
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
    // King should be rendered as "K" (possibly grouped with others)
    expectCardLabelRendered("K");
  });

  it("should cover zero point sorting branches", () => {
    // Mix zero and non-zero point results
    const fifteensContributions = [createContribution(Rank.FIVE, 2)];

    renderExpandedStarterDetails({
      fifteensContributions,
      sortOrder: SortOrder.Descending,
    });

    expectCardLabelRendered("5");

    // Verify that zero point rows (like rank 4) are sorted after
    // CardLabel for '5' should be before CardLabel for '4'
    const fiveLabel = getAllByCardText(screen, "5")[0]!;
    const fourLabel = getAllByCardText(screen, "4")[0]!;

    // DOCUMENT_POSITION_FOLLOWING is 4
    const FOLLOWING = 4;

    expect(fiveLabel.compareDocumentPosition(fourLabel)).toBe(FOLLOWING);
  });

  it("should keep starter specifics collapsed until the nested expansion opens", () => {
    renderRow({ fifteensContributions: MOCK_FIFTEENS_CONTRIBUTIONS });

    expect(screen.queryByText("5")).toBeNull();

    expandStarterDetails();

    expectCardLabelRendered("5");
  });
});
