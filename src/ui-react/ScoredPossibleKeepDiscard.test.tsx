import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { CARDS_PER_KEPT_HAND } from "../game/facts";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import {
  expectedCutAddedPoints,
  expectedHandPoints,
} from "../game/expectedHandPoints";
import { handPoints } from "../game/handPoints";
import { handToSortedString } from "./handToSortedString.test.common";

const EXPECTED_POINTS_FRACTION_DIGITS = 2;
const EXPECTED_CELL_COUNT = 7;

function setupScenario(sortOrderName: keyof typeof SortOrder) {
  const sortOrder = SortOrder[sortOrderName];
  const dealtHand = dealHand(Math.random);
  const keep = dealtHand.slice(0, CARDS_PER_KEPT_HAND);
  const discard = dealtHand.slice(CARDS_PER_KEPT_HAND);
  const points = handPoints(keep).total;
  const expectedPoints = expectedHandPoints(keep, discard).total;
  const expectedCutAdded = expectedCutAddedPoints(keep, discard);
  const keepString = handToSortedString(keep, sortOrder);
  const discardString = handToSortedString(discard, sortOrder);

  return {
    discard,
    discardString,
    expectedCutAdded,
    expectedPoints,
    keep,
    keepString,
    points,
    sortOrder,
  };
}

const highlightedPresent = (isHighlighted: boolean) => {
  const { discard, expectedCutAdded, expectedPoints, keep, points, sortOrder } =
    setupScenario("Ascending");

  const { container } = render(
    <table>
      <tbody>
        <ScoredPossibleKeepDiscard
          discard={discard}
          expectedCutAddedFifteens={expectedCutAdded.fifteens}
          expectedCutAddedPairs={expectedCutAdded.pairs}
          expectedCutAddedRuns={expectedCutAdded.runs}
          expectedHandPoints={expectedPoints}
          handPoints={points}
          isHighlighted={isHighlighted}
          keep={keep}
          sortOrder={sortOrder}
        />
      </tbody>
    </table>,
  );

  const rowClass = container.querySelector("tr")?.className ?? "";

  return rowClass.includes("highlighted");
};

describe("calculation component", () => {
  it.each(SORT_ORDER_NAMES)(
    "should render %s ordered keep then discard then the points",
    (sortOrderName) => {
      const {
        discard,
        discardString,
        expectedCutAdded,
        expectedPoints,
        keep,
        keepString,
        points,
        sortOrder,
      } = setupScenario(sortOrderName);

      render(
        <table>
          <tbody>
            <ScoredPossibleKeepDiscard
              discard={discard}
              expectedCutAddedFifteens={expectedCutAdded.fifteens}
              expectedCutAddedPairs={expectedCutAdded.pairs}
              expectedCutAddedRuns={expectedCutAdded.runs}
              expectedHandPoints={expectedPoints}
              handPoints={points}
              isHighlighted={false}
              keep={keep}
              sortOrder={sortOrder}
            />
          </tbody>
        </table>,
      );

      const cells = screen.getAllByRole("cell");
      const texts = cells.map((cell) => String(cell.textContent));

      expect(cells).toHaveLength(EXPECTED_CELL_COUNT);
      expect(cells.every(Boolean)).toBe(true);
      expect(texts).toStrictEqual([
        expect.stringMatching(
          new RegExp(`${keepString}.*\\(${discardString}\\)`, "u"),
        ),
        points.toString(),
        (expectedPoints - points).toFixed(EXPECTED_POINTS_FRACTION_DIGITS),
        expectedCutAdded.fifteens.toFixed(EXPECTED_POINTS_FRACTION_DIGITS),
        expectedCutAdded.pairs.toFixed(EXPECTED_POINTS_FRACTION_DIGITS),
        expectedCutAdded.runs.toFixed(EXPECTED_POINTS_FRACTION_DIGITS),
        expectedPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS),
      ]);
    },
  );

  it("should toggle highlighted class based on prop", () => {
    expect(highlightedPresent(true)).toBe(true);
    expect(highlightedPresent(false)).toBe(false);
  });
});
