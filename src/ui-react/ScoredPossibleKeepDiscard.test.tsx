import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { CARDS_PER_KEPT_HAND } from "../game/facts";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { createElement } from "react";
import { dealHand } from "../game/dealHand";
import expectedCribPointsTableData from "../game/expectedCribPointsTable.json";
import { expectedCutAddedPoints } from "../game/expectedCutAddedPoints";
import { expectedHandPoints } from "../game/expectedHandPoints";
import { handPoints } from "../game/handPoints";
import { handToSortedString } from "./handToSortedString.test.common";
import { setTableSync } from "../game/expectedCribPointsTableLoader";

const EXPECTED_POINTS_FRACTION_DIGITS = 2;
const EXPECTED_CELL_COUNT = 5;
const EXPECTED_CRIB_POINTS = 1.25;
const EXPECTED_PLAY_POINTS = 0.75;
const TINY_NEGATIVE_EXPECTED_PLAY_POINTS = -0.0047;
const missingCribPointBreakdown = new Map<string, never>().get("missing");
const CRIB_STARTER_POINTS = [
  {
    expectedCribPoints: EXPECTED_CRIB_POINTS,
    pointBreakdown: missingCribPointBreakdown,
    remainingStarterCount: 4,
    signedExpectedCribPoints: EXPECTED_CRIB_POINTS,
    starterRank: "A",
    starterSuitRelationPoints: [],
  },
] as const;

interface RenderComponentOptions {
  readonly expectedPlayPoints?: number;
  readonly isHighlighted?: boolean;
  readonly signedExpectedCribPoints?: number;
}

function setupScenario(sortOrderName: keyof typeof SortOrder) {
  const sortOrder = SortOrder[sortOrderName];
  const dealtHand = dealHand(Math.random);
  const keep = dealtHand.slice(0, CARDS_PER_KEPT_HAND);
  const discard = dealtHand.slice(CARDS_PER_KEPT_HAND);
  const points = handPoints(keep).total;
  const pointsBreakdown = handPoints(keep);
  const expectedPoints = expectedHandPoints(keep, discard).total;
  const expectedNetPoints =
    expectedPoints + EXPECTED_CRIB_POINTS + EXPECTED_PLAY_POINTS;
  const cutAdded = expectedCutAddedPoints(keep, discard);
  const keepString = handToSortedString(keep, sortOrder);
  const discardString = handToSortedString(discard, sortOrder);

  return {
    cutAdded,
    discard,
    discardString,
    expectedNetPoints,
    expectedPoints,
    keep,
    keepString,
    points,
    pointsBreakdown,
    sortOrder,
  };
}

function renderComponentWithScenario(
  scenario: ReturnType<typeof setupScenario>,
  {
    expectedPlayPoints = EXPECTED_PLAY_POINTS,
    isHighlighted = false,
    signedExpectedCribPoints = EXPECTED_CRIB_POINTS,
  }: RenderComponentOptions = {},
) {
  setTableSync(
    expectedCribPointsTableData as unknown as ExpectedCribPointsTable,
  );
  const expectedNetPoints =
    scenario.expectedPoints + signedExpectedCribPoints + expectedPlayPoints;

  const scoredKeepDiscard = {
    avgCutAdded15s: scenario.cutAdded.avg15s,
    avgCutAddedFlushes: scenario.cutAdded.avgFlushes,
    avgCutAddedNobs: scenario.cutAdded.avgNobs,
    avgCutAddedPairs: scenario.cutAdded.avgPairs,
    avgCutAddedRuns: scenario.cutAdded.avgRuns,
    cribStarterPoints: CRIB_STARTER_POINTS,
    cutCountsRemaining: scenario.cutAdded.cutCountsRemaining,
    discard: scenario.discard,
    expectedCribPointBreakdown: missingCribPointBreakdown,
    expectedCribPoints: Math.abs(signedExpectedCribPoints),
    expectedHandPoints: scenario.expectedPoints,
    expectedNetPoints,
    expectedPlayPoints: {
      dealer: {
        pointBreakdown: {
          fifteens: 0.25,
          go: 0.2,
          lastCard: 0.15,
          pairs: 0.5,
          runs: 0.4,
          thirtyOnes: 0.25,
        },
        total: 1.75,
      },
      delta: expectedPlayPoints,
      pone: {
        pointBreakdown: {
          fifteens: 0.1,
          go: 0.1,
          lastCard: 0.1,
          pairs: 0.25,
          runs: 0.25,
          thirtyOnes: 0.2,
        },
        total: 1,
      },
    },
    fifteensContributions: scenario.cutAdded.fifteensContributions,
    flushesContributions: scenario.cutAdded.flushesContributions,
    handPoints: scenario.points,
    handPointsBreakdown: scenario.pointsBreakdown,
    keep: scenario.keep,
    nobsContributions: scenario.cutAdded.nobsContributions,
    pairsContributions: scenario.cutAdded.pairsContributions,
    runsContributions: scenario.cutAdded.runsContributions,
    signedExpectedCribPoints,
  };

  const props = {
    cribRole: CribRole.Dealer,
    isHighlighted,
    rowIndex: 0,
    scoredKeepDiscard,
    sortOrder: scenario.sortOrder,
  };

  return render(
    <table>
      <tbody>{createElement(ScoredPossibleKeepDiscard, props)}</tbody>
    </table>,
  );
}

const highlightedPresent = (isHighlighted: boolean) => {
  const scenario = setupScenario("Ascending");
  const { container } = renderComponentWithScenario(scenario, {
    isHighlighted,
  });
  const rowClass = container.querySelector("tr")?.className ?? "";

  return rowClass.includes("highlighted");
};

const firstRenderedRow = () => screen.getAllByRole("row")[0] as HTMLElement;

const hasBreakdownHeader = () => screen.queryAllByText(/^15s$/u).length > 0;

const toggleMainRow = () => {
  fireEvent.click(firstRenderedRow());
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
            `${scenario.keepString.replace(/[♣♦♥♠]/gu, "[♣♦♥♠]")}.*\\(${scenario.discardString.replace(/[♣♦♥♠]/gu, "[♣♦♥♠]")}\\).*▸`,
            "u",
          ),
        ),
        scenario.expectedPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS),
        `+${EXPECTED_CRIB_POINTS.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}`,
        `+${EXPECTED_PLAY_POINTS.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}`,
        scenario.expectedNetPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS),
      ]);
    },
  );

  it("should toggle highlighted class based on prop", () => {
    expect(highlightedPresent(true)).toBe(true);
    expect(highlightedPresent(false)).toBe(false);
  });

  it("renders negative signed crib points without a plus sign", () => {
    const scenario = setupScenario("Ascending");

    renderComponentWithScenario(scenario, {
      signedExpectedCribPoints: -EXPECTED_CRIB_POINTS,
    });

    expect(
      screen.getByText(`−${EXPECTED_CRIB_POINTS.toFixed(2)}`),
    ).toBeTruthy();
  });

  it("renders play points that round to zero without a negative sign", () => {
    const scenario = setupScenario("Ascending");

    renderComponentWithScenario(scenario, {
      expectedPlayPoints: TINY_NEGATIVE_EXPECTED_PLAY_POINTS,
    });

    const cells = screen.getAllByRole("cell");
    const playCellText = String(cells[3]?.textContent);

    expect(playCellText).toBe("0.00");
    expect(playCellText).not.toBe("−0.00");
  });

  const setupAndRender = () => {
    const scenario = setupScenario("Ascending");
    renderComponentWithScenario(scenario);

    expect(hasBreakdownHeader()).toBe(false);
  };

  it("should expand and collapse when clicked", () => {
    setupAndRender();

    toggleMainRow();

    expect(hasBreakdownHeader()).toBe(true);

    toggleMainRow();

    expect(hasBreakdownHeader()).toBe(false);
  });

  it("should expand and collapse when the expand button is clicked directly", () => {
    setupAndRender();

    const expandButton = screen.getByRole("button", {
      name: /Expand analysis/u,
    });
    fireEvent.click(expandButton);

    expect(hasBreakdownHeader()).toBe(true);

    const collapseButton = screen.getByRole("button", {
      name: /Collapse analysis/u,
    });
    fireEvent.click(collapseButton);

    expect(hasBreakdownHeader()).toBe(false);
  });

  it("should drill into starter details when clicking the hand starter row", () => {
    const scenario = setupScenario("Ascending");
    renderComponentWithScenario(scenario);

    toggleMainRow();

    fireEvent.click(screen.getByRole("button", { name: /\+Cut avg/u }));

    expect(hasBreakdownHeader()).toBe(true);
    expect(screen.getAllByText(/\+Cut avg/u)).toHaveLength(1);

    toggleMainRow();

    expect(hasBreakdownHeader()).toBe(false);
  });
});
