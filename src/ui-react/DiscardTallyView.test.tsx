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
      name: "gives today a column of its own alongside all time",
      scoped: 1,
      today: { decisions: 5, mean: 0.4128 },
    },
    {
      name: "shows all time alone before a decision is made today",
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

    // Named once as a column heading rather than repeated beside every figure.
    expect(queryAllByText("today")).toHaveLength(scoped);
  });

  /*
   * The skipped row appears only once a hand has been abandoned, and takes a
   * today column only when today has decisions to compare it against.
   */
  it.each([
    {
      mean: 0.4128,
      name: "beside today once a hand was played today",
      today: 5,
    },
    {
      mean: null,
      name: "on its own before anything was played today",
      today: 0,
    },
  ])("shows skips $name", ({ mean, today }) => {
    const { queryAllByText } = render(
      <DiscardTallyView
        summary={discardTallySummary({
          skippedHands: 3,
          todayDecisions: today,
          todayMeanExpectedPointsLoss: mean,
          todaySkippedHands: 1,
        })}
      />,
    );

    expect(queryAllByText("Hands skipped")).toHaveLength(1);
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
