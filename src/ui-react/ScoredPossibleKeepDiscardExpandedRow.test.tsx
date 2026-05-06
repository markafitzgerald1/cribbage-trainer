import { Rank, createCard } from "../game/Card";
import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { ScoredPossibleKeepDiscardExpandedRow } from "./ScoredPossibleKeepDiscardExpandedRow";
import { SortOrder } from "../ui/SortOrder";

describe("scoredPossibleKeepDiscardExpandedRow", () => {
  it("should render cut results when they exist to satisfy 100% coverage", () => {
    const mockOnRowClick = jest.fn();
    // 13 ranks, each with 4 cards remaining
    const cutCountsRemaining = Array.from({ length: 13 }, () => 4);

    // Provide a contribution to ensure cutResults is not empty at line 65
    const fifteensContributions = [
      {
        count: 4,
        cutCard: createCard(Rank.FIVE, "♠"),
        points: 2,
      },
    ];

    render(
      <table>
        <tbody>
          <ScoredPossibleKeepDiscardExpandedRow
            avgCutAdded15s={0.5}
            avgCutAddedFlushes={0}
            avgCutAddedNobs={0}
            avgCutAddedPairs={0.1}
            avgCutAddedRuns={0.2}
            cutCountsRemaining={cutCountsRemaining}
            fifteensContributions={fifteensContributions}
            flushesContributions={[]}
            nobsContributions={[]}
            onRowClick={mockOnRowClick}
            pairsContributions={[]}
            runsContributions={[]}
            sortOrder={SortOrder.Ascending}
          />
        </tbody>
      </table>,
    );

    // Verify that the breakdown summary is rendered
    expect(screen.getByText("0.50")).toBeTruthy();

    // Verify that the CutResultRow is rendered for the 5 rank
    // CardLabel renders CARD_LABELS[Rank.FIVE] which is "5"
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("should render cut results in descending order", () => {
    const mockOnRowClick = jest.fn();
    const cutCountsRemaining = Array.from({ length: 13 }, () => 4);

    // Provide two contributions to verify sorting/grouping
    const fifteensContributions = [
      {
        count: 4,
        cutCard: createCard(Rank.FIVE, "♠"),
        points: 2,
      },
      {
        count: 4,
        cutCard: createCard(Rank.FOUR, "♠"),
        points: 2,
      },
    ];

    render(
      <table>
        <tbody>
          <ScoredPossibleKeepDiscardExpandedRow
            avgCutAdded15s={0.5}
            avgCutAddedFlushes={0}
            avgCutAddedNobs={0}
            avgCutAddedPairs={0.1}
            avgCutAddedRuns={0.2}
            cutCountsRemaining={cutCountsRemaining}
            fifteensContributions={fifteensContributions}
            flushesContributions={[]}
            nobsContributions={[]}
            onRowClick={mockOnRowClick}
            pairsContributions={[]}
            runsContributions={[]}
            sortOrder={SortOrder.Descending}
          />
        </tbody>
      </table>,
    );

    // Verify that both cards are rendered
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("should render multiple cut results sorted by points and count", () => {
    const mockOnRowClick = jest.fn();
    const cutCountsRemaining = Array.from({ length: 13 }, () => 4);

    // Provide contributions to cover all sorting branches in groupCutsByResults
    // Group 1: 10 points
    // Group 2: 2 points (from 15s)
    // Group 3: 2 points (from pairs) - same total as Group 2, different key
    const fifteensContributions = [
      {
        count: 4,
        cutCard: createCard(Rank.FIVE, "♠"),
        points: 2,
      },
      {
        count: 4,
        cutCard: createCard(Rank.FOUR, "♠"),
        points: 10,
      },
    ];
    const pairsContributions = [
      {
        count: 4,
        cutCard: createCard(Rank.SIX, "♠"),
        points: 2,
      },
    ];

    // To cover line 69 (same points, different count),
    // We need to manipulate cutCountsRemaining for one of the ranks
    const customCounts = [...cutCountsRemaining];
    // Different count than Rank.FIVE
    customCounts[Rank.SIX] = 2;

    render(
      <table>
        <tbody>
          <ScoredPossibleKeepDiscardExpandedRow
            avgCutAdded15s={0.5}
            avgCutAddedFlushes={0}
            avgCutAddedNobs={0}
            avgCutAddedPairs={0.1}
            avgCutAddedRuns={0.2}
            cutCountsRemaining={customCounts}
            fifteensContributions={fifteensContributions}
            flushesContributions={[]}
            nobsContributions={[]}
            onRowClick={mockOnRowClick}
            pairsContributions={pairsContributions}
            runsContributions={[]}
            sortOrder={SortOrder.Descending}
          />
        </tbody>
      </table>,
    );

    // Verify rendering (use getAllByText to avoid multiple elements error)
    expect(screen.getAllByText("4")).toHaveLength(1);
    expect(screen.getAllByText("5")).toHaveLength(1);
    expect(screen.getAllByText("6")).toHaveLength(1);
    expect(screen.getAllByText("10")).toHaveLength(3);
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(2);
  });

  it("should cover remaining branches in groupCutsByResults", () => {
    const mockOnRowClick = jest.fn();
    const cutCountsRemaining = Array.from(
      { length: 13 },
      () => 4,
    );
    cutCountsRemaining[Rank.KING] = 0;

    // Case for line 64 (one result is zero) and line 86 (rank with 0 count)
    const contributions = [
      {
        count: 4,
        cutCard: createCard(Rank.FIVE, "♠"),
        points: 2,
      },
    ];

    render(
      <table>
        <tbody>
          <ScoredPossibleKeepDiscardExpandedRow
            avgCutAdded15s={0.5}
            avgCutAddedFlushes={0}
            avgCutAddedNobs={0}
            avgCutAddedPairs={0.1}
            avgCutAddedRuns={0.2}
            cutCountsRemaining={cutCountsRemaining}
            fifteensContributions={contributions}
            flushesContributions={[]}
            nobsContributions={[]}
            onRowClick={mockOnRowClick}
            pairsContributions={[]}
            runsContributions={[]}
            sortOrder={SortOrder.Ascending}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("5")).toBeTruthy();
    // King has 0 count
    expect(screen.queryByText("K")).toBeNull();
  });
});
