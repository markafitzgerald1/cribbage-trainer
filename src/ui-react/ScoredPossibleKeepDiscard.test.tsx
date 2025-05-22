import { describe, expect, it, jest } from "@jest/globals";
import { CARDS_PER_KEPT_HAND } from "../game/facts";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { expectedHandPoints } from "../game/expectedHandPoints";
import { handPoints } from "../game/handPoints";
import { handToSortedString } from "./handToSortedString.test.common";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComparableCard } from "../ui/sortCards"; // Path based on previous file structure

// Mock classes to simplify testing, actual CSS class names are not critical for these tests
jest.mock("./ScoredPossibleKeepDiscard.module.css", () => ({
  scoredPossibleKeepDiscardItem: "scoredPossibleKeepDiscardItem",
  summaryRow: "summaryRow",
  handDisplay: "handDisplay",
  totalPointsDisplay: "totalPointsDisplay",
  chevronIcon: "chevronIcon",
  detailsView: "detailsView",
}));

const EXPECTED_POINTS_FRACTION_DIGITS = 2;

// Helper to create mock card data
const createMockCards = (count: number, baseName = "Card"): ComparableCard[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${baseName}${i + 1}`,
    description: `${baseName} ${i + 1}`,
    sortKey: i,
    dealOrder: i, // Added dealOrder for completeness
    suit: i % 4, // Example suit
    rank: (i % 13) + 2, // Example rank
    value: (i % 13) + 2, // Example value
  }));
};

describe("ScoredPossibleKeepDiscard", () => {
  const mockKeep: ComparableCard[] = createMockCards(CARDS_PER_KEPT_HAND, "Keep");
  const mockDiscard: ComparableCard[] = createMockCards(2, "Discard");
  const mockHandPoints = 10;
  const mockExpectedHandPoints = 15.75; // Total average
  const mockSortOrder = SortOrder.SuitThenRankAscending;

  const renderComponent = () =>
    render(
      <ScoredPossibleKeepDiscard
        keep={mockKeep}
        discard={mockDiscard}
        handPoints={mockHandPoints}
        expectedHandPoints={mockExpectedHandPoints}
        sortOrder={mockSortOrder}
      />,
    );

  it("renders initial collapsed state correctly", () => {
    renderComponent();
    const listItem = screen.getByRole("listitem");

    // Check for summary content (simplified)
    const keepString = handToSortedString(mockKeep, mockSortOrder);
    const discardString = handToSortedString(mockDiscard, mockSortOrder);
    expect(screen.getByText(new RegExp(`${keepString}.*\\(${discardString}\\)`))).toBeInTheDocument();
    expect(screen.getByText(`= ${mockExpectedHandPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}`)).toBeInTheDocument();
    
    // Check ARIA attribute and chevron
    expect(listItem).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("▶")).toBeInTheDocument(); // Collapsed chevron

    // Details view should not be present
    expect(screen.queryByText(/Breakdown:/)).not.toBeInTheDocument();
    // Or by class if detailsView always has content:
    // expect(screen.queryByRole('generic', { name: /detailsView/i })).not.toBeInTheDocument(); 
    // Using queryByRole with a class name is not standard. Better to query by text or test ID.
  });

  it("expands on click and shows details", () => {
    renderComponent();
    const listItem = screen.getByRole("listitem");

    fireEvent.click(listItem);

    // ARIA attribute and chevron update
    expect(listItem).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("▼")).toBeInTheDocument(); // Expanded chevron

    // Details view is visible with correct content
    const detailsView = screen.getByText(/Breakdown:/);
    expect(detailsView).toBeInTheDocument();
    const averageCutPoints = mockExpectedHandPoints - mockHandPoints;
    expect(detailsView).toHaveTextContent(
      `Breakdown: ${mockHandPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} (hand) + ${averageCutPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} (avg. cut)`
    );
  });

  it("collapses on second click", () => {
    renderComponent();
    const listItem = screen.getByRole("listitem");

    // First click to expand
    fireEvent.click(listItem);
    expect(listItem).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("▼")).toBeInTheDocument();

    // Second click to collapse
    fireEvent.click(listItem);
    expect(listItem).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("▶")).toBeInTheDocument();
    expect(screen.queryByText(/Breakdown:/)).not.toBeInTheDocument();
  });

  it.each([
    ["Enter", { key: "Enter", code: "Enter" }],
    ["Space", { key: " ", code: "Space" }],
  ])("toggles expansion with %s key", (_, keyEventDetails) => {
    renderComponent();
    const listItem = screen.getByRole("listitem");
    listItem.focus(); // Item must be focused for keyboard events

    // Press key to expand
    fireEvent.keyDown(listItem, keyEventDetails);
    expect(listItem).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("▼")).toBeInTheDocument();
    expect(screen.getByText(/Breakdown:/)).toBeInTheDocument();

    // Press key to collapse
    fireEvent.keyDown(listItem, keyEventDetails);
    expect(listItem).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("▶")).toBeInTheDocument();
    expect(screen.queryByText(/Breakdown:/)).not.toBeInTheDocument();
  });

  // Keep original test structure if it provides additional value,
  // but adapt it for the new summary display.
  describe("Original display logic (summary row)", () => {
    it.each(SORT_ORDER_NAMES)(
      "should render %s ordered keep/discard and total points in summary",
      (sortOrderName) => {
        const sortOrder = SortOrder[sortOrderName];
        // Using real game logic functions for data generation
        const dealtHand = dealHand(Math.random); 
        const currentKeep = dealtHand.slice(0, CARDS_PER_KEPT_HAND);
        const currentDiscard = dealtHand.slice(CARDS_PER_KEPT_HAND);
        const currentHandPoints = handPoints(currentKeep).total;
        const currentExpectedPoints = expectedHandPoints(currentKeep, currentDiscard).total;
        
        render(
          <ScoredPossibleKeepDiscard
            discard={currentDiscard}
            expectedHandPoints={currentExpectedPoints}
            handPoints={currentHandPoints}
            keep={currentKeep}
            sortOrder={sortOrder}
          />,
        );

        const keepString = handToSortedString(currentKeep, sortOrder);
        const discardString = handToSortedString(currentDiscard, sortOrder);
        
        // Check for the summary string (now without the breakdown)
        const summaryPattern = new RegExp(
          `${keepString}.*\\(${discardString}\\).*=\\s*${currentExpectedPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}`
        );
        // Using screen.getByText with a regex
        expect(screen.getByText(summaryPattern)).toBeInTheDocument();

        // Ensure breakdown is not visible by default
        expect(screen.queryByText(/Breakdown:/)).not.toBeInTheDocument();
      },
    );
  });
});
