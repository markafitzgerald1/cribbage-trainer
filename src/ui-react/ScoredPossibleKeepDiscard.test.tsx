import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { CARDS_PER_KEPT_HAND } from "../game/facts";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { expectedCutAddedPoints } from "../game/expectedCutAddedPoints";
import { expectedHandPoints } from "../game/expectedHandPoints";
import { handPoints } from "../game/handPoints";
import { handToSortedString } from "./handToSortedString.test.common";

const EXPECTED_POINTS_FRACTION_DIGITS = 2;
const EXPECTED_CELL_COUNT = 4;

function setupScenario(sortOrderName: keyof typeof SortOrder) {
  const sortOrder = SortOrder[sortOrderName];
  const dealtHand = dealHand(Math.random);
  const keep = dealtHand.slice(0, CARDS_PER_KEPT_HAND);
  const discard = dealtHand.slice(CARDS_PER_KEPT_HAND);
  const points = handPoints(keep).total;
  const expectedPoints = expectedHandPoints(keep, discard).total;
  const cutAdded = expectedCutAddedPoints(keep, discard);
  const keepString = handToSortedString(keep, sortOrder);
  const discardString = handToSortedString(discard, sortOrder);

  return {
    cutAdded,
    discard,
    discardString,
    expectedPoints,
    keep,
    keepString,
    points,
    sortOrder,
  };
}

function renderComponentWithScenario(
  scenario: ReturnType<typeof setupScenario>,
  isHighlighted = false,
) {
  return render(
    <table>
      <tbody>
        <ScoredPossibleKeepDiscard
          avgCutAdded15s={scenario.cutAdded.avg15s}
          avgCutAddedPairs={scenario.cutAdded.avgPairs}
          avgCutAddedRuns={scenario.cutAdded.avgRuns}
          cutCountsRemaining={scenario.cutAdded.cutCountsRemaining}
          discard={scenario.discard}
          expectedHandPoints={scenario.expectedPoints}
          fifteensContributions={scenario.cutAdded.fifteensContributions}
          handPoints={scenario.points}
          isHighlighted={isHighlighted}
          keep={scenario.keep}
          pairsContributions={scenario.cutAdded.pairsContributions}
          rowIndex={0}
          runsContributions={scenario.cutAdded.runsContributions}
          sortOrder={scenario.sortOrder}
        />
      </tbody>
    </table>,
  );
}

const highlightedPresent = (isHighlighted: boolean) => {
  const scenario = setupScenario("Ascending");
  const { container } = renderComponentWithScenario(scenario, isHighlighted);
  const rowClass = container.querySelector("tr")?.className ?? "";

  return rowClass.includes("highlighted");
};

describe("calculation component", () => {
  it.each(SORT_ORDER_NAMES)(
    "should render %s ordered keep then discard then the points",
    (sortOrderName) => {
      const scenario = setupScenario(sortOrderName);

      renderComponentWithScenario(scenario);

      const cells = screen.getAllByRole("cell");
      const texts = cells.map((cell) => String(cell.textContent));

      expect(cells).toHaveLength(EXPECTED_CELL_COUNT);
      expect(cells.every(Boolean)).toBe(true);
      expect(texts).toStrictEqual([
        expect.stringMatching(
          new RegExp(
            `${scenario.keepString}.*\\(${scenario.discardString}\\)`,
            "u",
          ),
        ),
        scenario.points.toString(),
        (scenario.expectedPoints - scenario.points).toFixed(
          EXPECTED_POINTS_FRACTION_DIGITS,
        ),
        `${scenario.expectedPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}▸`,
      ]);
    },
  );

  it("should toggle highlighted class based on prop", () => {
    expect(highlightedPresent(true)).toBe(true);
    expect(highlightedPresent(false)).toBe(false);
  });

  it("should expand and collapse when clicked", () => {
    const scenario = setupScenario("Ascending");
    renderComponentWithScenario(scenario);
    const getRow = () => screen.getAllByRole("row")[0] as HTMLElement;
    const isExpanded = () => screen.queryByText(/^15s$/u) !== null;

    expect(isExpanded()).toBe(false);

    fireEvent.click(getRow());

    expect(isExpanded()).toBe(true);

    fireEvent.click(getRow());

    expect(isExpanded()).toBe(false);
  });

  it("should collapse expansion when clicking the expanded row", () => {
    const scenario = setupScenario("Ascending");
    renderComponentWithScenario(scenario);
    const getMainRow = () => screen.getAllByRole("row")[0] as HTMLElement;
    const getExpandedRow = () => screen.getAllByRole("row")[1] as HTMLElement;
    const isExpanded = () => screen.queryByText(/^15s$/u) !== null;

    fireEvent.click(getMainRow());

    expect(isExpanded()).toBe(true);

    fireEvent.click(getExpandedRow());

    expect(isExpanded()).toBe(false);
  });
});
