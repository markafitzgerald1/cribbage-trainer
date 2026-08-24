import { describe, expect, it } from "@jest/globals";
import { DiscardTallyView } from "./DiscardTallyView";
import { discardTallySummary } from "./discardTally.test.common";
import { render } from "@testing-library/react";

describe("discard tally view", () => {
  /*
   * Today appears only once there is a decision from today to average. A zero
   * would read as faultless play on a day nobody has played yet.
   */
  it.each([
    {
      name: "scopes both measures to today as well as all time",
      scoped: 2,
      today: { decisions: 5, mean: 0.4128 },
    },
    {
      name: "names only all time before a decision is made today",
      scoped: 0,
      today: { decisions: 0, mean: null },
    },
  ])("$name", ({ scoped, today }) => {
    const { queryAllByText } = render(
      <DiscardTallyView
        summary={discardTallySummary({
          todayDecisions: today.decisions,
          todayMeanExpectedPointsLoss: today.mean,
          todayOptimalDecisions: 2,
        })}
      />,
    );

    // One per measure, so a reader can never mistake which period a figure belongs to.
    expect(queryAllByText("today")).toHaveLength(scoped);
  });

  // The skipped row appears only once a hand has been abandoned, and names today only once one was abandoned today.
  it.each([
    { name: "both periods once a hand is skipped today", rows: 1, today: 2 },
    { name: "all time only when none was skipped today", rows: 1, today: 0 },
  ])("shows skips: $name", ({ rows, today }) => {
    const { queryAllByText } = render(
      <DiscardTallyView
        summary={{
          ...discardTallySummary({
            todayDecisions: 5,
            todayMeanExpectedPointsLoss: 0.4128,
          }),
          skippedHands: 3,
          todaySkippedHands: today,
        }}
      />,
    );

    expect(queryAllByText("Hands skipped")).toHaveLength(rows);
  });

  it("says nothing at all before any decision is recorded", () => {
    const { container } = render(
      <DiscardTallyView
        summary={discardTallySummary({
          decisions: 0,
          meanExpectedPointsLoss: null,
          optimalDecisions: 0,
        })}
      />,
    );

    expect(container.textContent).toBe("");
  });
});
