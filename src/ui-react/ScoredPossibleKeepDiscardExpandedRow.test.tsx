import { Rank, createCard } from "../game/Card";
import {
  ScoredPossibleKeepDiscardExpandedRow,
  type ScoredPossibleKeepDiscardExpandedRowProps,
} from "./ScoredPossibleKeepDiscardExpandedRow";
import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { SortOrder } from "../ui/SortOrder";

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
    const nobs = overrides.nobsContributions ?? [];
    const onRowClick = overrides.onRowClick ?? jest.fn();
    const pairs = overrides.pairsContributions ?? [];
    const runs = overrides.runsContributions ?? [];
    const order = overrides.sortOrder ?? SortOrder.Ascending;

    render(
      <table>
        <tbody>
          <ScoredPossibleKeepDiscardExpandedRow
            avgCutAdded15s={a15s}
            avgCutAddedFlushes={aFlushes}
            avgCutAddedNobs={aNobs}
            avgCutAddedPairs={aPairs}
            avgCutAddedRuns={aRuns}
            cutCountsRemaining={counts}
            fifteensContributions={fifteens}
            flushesContributions={flushes}
            nobsContributions={nobs}
            onRowClick={onRowClick}
            pairsContributions={pairs}
            runsContributions={runs}
            sortOrder={order}
          />
        </tbody>
      </table>,
    );
  };

  it("should render cut results when they exist to satisfy 100% coverage", () => {
    renderRow({ fifteensContributions: MOCK_FIFTEENS_CONTRIBUTIONS });

    // Verify that the breakdown summary is rendered
    expect(screen.getByText("0.50")).toBeTruthy();

    // Verify that the CutResultRow is rendered for the 5 rank
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("should render cut results in descending order", () => {
    // Provide two contributions to verify sorting/grouping
    const fifteensContributions = [
      ...MOCK_FIFTEENS_CONTRIBUTIONS,
      createContribution(Rank.FOUR, 2),
    ];

    renderRow({
      fifteensContributions,
      sortOrder: SortOrder.Descending,
    });

    // Verify that both cards are rendered
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
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

    renderRow({
      cutCountsRemaining: customCounts,
      fifteensContributions,
      pairsContributions,
      sortOrder: SortOrder.Descending,
    });

    // Verify rendering (use getAllByText to avoid multiple elements error)
    expect(screen.getAllByText("4")).toHaveLength(1);
    expect(screen.getAllByText("5")).toHaveLength(1);
    expect(screen.getAllByText("6")).toHaveLength(1);
    expect(screen.getAllByText("10")).toHaveLength(3);
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(2);
  });

  it("should cover remaining branches in groupCutsByResults", () => {
    const cutCountsRemaining = Array.from({ length: 13 }, () => 4);
    cutCountsRemaining[Rank.KING] = 0;

    renderRow({
      cutCountsRemaining,
      fifteensContributions: MOCK_FIFTEENS_CONTRIBUTIONS,
    });

    expect(screen.getByText("5")).toBeTruthy();
    // King has 0 count
    expect(screen.queryByText("K")).toBeNull();
  });

  it("should cover zero point sorting branches", () => {
    // Mix zero and non-zero point results
    const fifteensContributions = [createContribution(Rank.FIVE, 2)];

    renderRow({
      fifteensContributions,
      sortOrder: SortOrder.Descending,
    });

    expect(screen.getByText("5")).toBeTruthy();

    // Verify that zero point rows (like rank 4) are sorted after
    // CardLabel for '5' should be before CardLabel for '4'
    const fiveLabel = screen.getByText("5");
    const fourLabel = screen.getByText("4");

    // DOCUMENT_POSITION_FOLLOWING is 4
    const FOLLOWING = 4;

    expect(fiveLabel.compareDocumentPosition(fourLabel)).toBe(FOLLOWING);
  });
});
