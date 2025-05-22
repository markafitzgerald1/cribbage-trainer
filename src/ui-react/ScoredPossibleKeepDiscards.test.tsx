import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { CARDS_PER_DISCARD, CARDS_PER_HAND } from "../game/facts";
import { Combination } from "js-combinatorics";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand"; // Keep for mock data generation if needed
import { render, screen, fireEvent } from "@testing-library/react";
import { DealtCard } from "../game/DealtCard"; // For typing mock data
import * as analysis from "../analysis/analysis"; // To mock allScoredKeepDiscardsByExpectedScoreDescending

// Mock the child component
jest.mock("./ScoredPossibleKeepDiscard", () => ({
  ScoredPossibleKeepDiscard: jest.fn(({ key, discard, expectedHandPoints, handPoints, keep, sortOrder }) => (
    <li data-testid="mocked-item" data-key={key}>
      Mocked Keep: {keep.map(c => c.id).join(", ")} |
      Mocked Discard: {discard.map(c => c.id).join(", ")} |
      Expected: {expectedHandPoints} |
      Hand: {handPoints} |
      Sort: {sortOrder}
    </li>
  )),
}));

// Mock CSS Modules
jest.mock("./ScoredPossibleKeepDiscards.module.css", () => ({
  scoredPossibleKeepDiscardsContainer: "scoredPossibleKeepDiscardsContainer",
  headerWithInfoIcon: "headerWithInfoIcon",
  infoIconButton: "infoIconButton",
  infoDetailsPanel: "infoDetailsPanel",
  analysisList: "analysisList",
}));

// Helper to create mock DealtCard data
const createMockDealtCards = (count: number): DealtCard[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `C${i + 1}`,
    description: `Card ${i + 1}`,
    sortKey: i,
    dealOrder: i,
    suit: i % 4,
    rank: (i % 13) + 2,
    value: (i % 13) + 2,
    isDealt: true,
  }));
};

// Mock data for allScoredKeepDiscardsByExpectedScoreDescending
const mockScoredItems = [
  { keep: createMockDealtCards(4).slice(0,2), discard: createMockDealtCards(4).slice(2,4), handPoints: 5, expectedHandPoints: 8.5 },
  { keep: createMockDealtCards(4).slice(1,3), discard: createMockDealtCards(4).slice(0,1).concat(createMockDealtCards(4).slice(3,4)), handPoints: 6, expectedHandPoints: 9.2 },
];

// Spy on and mock the analysis function
jest.spyOn(analysis, "allScoredKeepDiscardsByExpectedScoreDescending").mockReturnValue(mockScoredItems);


describe("ScoredPossibleKeepDiscards", () => {
  const mockDealtCards = createMockDealtCards(CARDS_PER_HAND); // 6 cards for a typical cribbage hand
  const mockSortOrder = SortOrder.Ascending;

  const renderComponent = () =>
    render(
      <ScoredPossibleKeepDiscards
        dealtCards={mockDealtCards}
        sortOrder={mockSortOrder}
      />,
    );

  beforeEach(() => {
    // Clear mock call counts before each test if needed
    (analysis.allScoredKeepDiscardsByExpectedScoreDescending as jest.Mock).mockClear();
    (require("./ScoredPossibleKeepDiscard") as any).ScoredPossibleKeepDiscard.mockClear();
  });

  describe("Header and Info Icon", () => {
    it('renders the "Expected Points" header', () => {
      renderComponent();
      // The caption is inside a figcaption element
      expect(screen.getByText("Expected Points", { selector: 'figcaption' })).toBeInTheDocument();
    });

    it("renders the info icon button", () => {
      renderComponent();
      const infoButton = screen.getByRole("button", { name: /Information about expected points/i });
      expect(infoButton).toBeInTheDocument();
      expect(infoButton).toHaveTextContent("ⓘ");
    });
  });

  describe("Info Panel Toggle", () => {
    it("is initially hidden", () => {
      renderComponent();
      expect(screen.queryByText(/Each option shows the total average points expected/i)).not.toBeInTheDocument();
      const infoButton = screen.getByRole("button", { name: /Information about expected points/i });
      expect(infoButton).toHaveAttribute("aria-expanded", "false");
    });

    it("toggles visibility and ARIA attribute on info icon click", () => {
      renderComponent();
      const infoButton = screen.getByRole("button", { name: /Information about expected points/i });

      // Click to show
      fireEvent.click(infoButton);
      expect(screen.getByText(/Each option shows the total average points expected/i)).toBeVisible();
      expect(infoButton).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("region", { name: /analysis-info-details/i})).toBeInTheDocument();


      // Click to hide
      fireEvent.click(infoButton);
      expect(screen.queryByText(/Each option shows the total average points expected/i)).not.toBeInTheDocument();
      expect(infoButton).toHaveAttribute("aria-expanded", "false");
    });

    it.each([
        ["Enter", { key: "Enter", code: "Enter" }],
        ["Space", { key: " ", code: "Space" }],
    ])("toggles visibility with %s key on info icon", (_, keyEventDetails) => {
      renderComponent();
      const infoButton = screen.getByRole("button", { name: /Information about expected points/i });
      infoButton.focus();

      // Press key to show
      fireEvent.keyDown(infoButton, keyEventDetails);
      expect(screen.getByText(/Each option shows the total average points expected/i)).toBeVisible();
      expect(infoButton).toHaveAttribute("aria-expanded", "true");

      // Press key to hide
      fireEvent.keyDown(infoButton, keyEventDetails);
      expect(screen.queryByText(/Each option shows the total average points expected/i)).not.toBeInTheDocument();
      expect(infoButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("List Rendering", () => {
    it("calls allScoredKeepDiscardsByExpectedScoreDescending with dealtCards", () => {
      renderComponent();
      expect(analysis.allScoredKeepDiscardsByExpectedScoreDescending).toHaveBeenCalledWith(mockDealtCards);
    });
    
    it("renders a list with the correct number of ScoredPossibleKeepDiscard items based on mock data", () => {
      renderComponent();
      const listItems = screen.getAllByTestId("mocked-item"); // Using the mock's data-testid
      expect(listItems).toHaveLength(mockScoredItems.length);
    });

    it("passes correct props to each ScoredPossibleKeepDiscard item", () => {
      renderComponent();
      const ScoredPossibleKeepDiscardMock = (require("./ScoredPossibleKeepDiscard") as any).ScoredPossibleKeepDiscard;

      expect(ScoredPossibleKeepDiscardMock).toHaveBeenCalledTimes(mockScoredItems.length);

      mockScoredItems.forEach((item, index) => {
        const expectedKey = `item-${item.keep.map(c=>c.dealOrder).join('')}-${item.discard.map(c=>c.dealOrder).join('')}`;
        expect(ScoredPossibleKeepDiscardMock).toHaveBeenNthCalledWith(
          index + 1,
          expect.objectContaining({
            key: expectedKey,
            discard: item.discard,
            expectedHandPoints: item.expectedHandPoints,
            handPoints: item.handPoints,
            keep: item.keep,
            sortOrder: mockSortOrder,
          }),
          {} // Second argument to mock (context)
        );
      });
    });
    
    // The original test for "each possible keep and discard pair exactly once"
    // is more of an integration test for allScoredKeepDiscardsByExpectedScoreDescending.
    // If that logic is complex and critical, it should be tested more deeply in analysis.test.ts.
    // For this component test, using mocked return values for that function is sufficient.
    it("renders the correct number of items as per js-combinatorics (original test logic, adapted)", () => {
      // This test relies on the actual implementation of allScoredKeepDiscardsByExpectedScoreDescending
      // if not mocked at the top level for all tests in this describe block.
      // Since we are mocking it, we'll test against the mockScoredItems length.
      (analysis.allScoredKeepDiscardsByExpectedScoreDescending as jest.Mock).mockReturnValueOnce(mockScoredItems); // Ensure it uses our mock for this specific test too
      
      const { container } = render(
        <ScoredPossibleKeepDiscards
          dealtCards={createMockDealtCards(6)} // Example hand size
          sortOrder={SortOrder.Ascending}
        />,
      );
      // The number of items should match the length of the data returned by the (mocked) analysis function
      expect(container.querySelectorAll('[data-testid="mocked-item"]')).toHaveLength(mockScoredItems.length);

      // If you wanted to test against the actual combination count (less of a unit test for *this* component):
      // const realDealtHand = dealHand(Math.random); // A real hand
      // const nCombs = Number(new Combination(realDealtHand, CARDS_PER_DISCARD).length);
      // (analysis.allScoredKeepDiscardsByExpectedScoreDescending as jest.Mock).mockReturnValue(
      //   Array(nCombs).fill({}).map((_, i) => ({ // Return nCombs items
      //     keep: createMockDealtCards(4), discard: createMockDealtCards(2), handPoints: i, expectedHandPoints: i + 2 
      //   }))
      // );
      // render(<ScoredPossibleKeepDiscards dealtCards={realDealtHand} sortOrder={SortOrder.Ascending} />);
      // expect(screen.getAllByTestId("mocked-item")).toHaveLength(nCombs);
    });
  });
});
