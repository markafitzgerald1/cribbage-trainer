import { describe, expect, it } from "@jest/globals";
import type { DiscardTallySummary } from "../ui/discardTally";
import { DiscardTallyView } from "./DiscardTallyView";
import { render } from "@testing-library/react";

const summaryOf = (today: {
  readonly decisions: number;
  readonly mean: number | null;
}): DiscardTallySummary => ({
  decisions: 24,
  meanExpectedPointsLoss: 0.7361,
  optimalDecisions: 9,
  todayDecisions: today.decisions,
  todayMeanExpectedPointsLoss: today.mean,
  todayOptimalDecisions: 2,
});

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
      <DiscardTallyView summary={summaryOf(today)} />,
    );

    // One per measure, so a reader can never mistake which period a figure belongs to.
    expect(queryAllByText("today")).toHaveLength(scoped);
  });

  it("says nothing at all before any decision is recorded", () => {
    const { container } = render(
      <DiscardTallyView
        summary={{
          decisions: 0,
          meanExpectedPointsLoss: null,
          optimalDecisions: 0,
          todayDecisions: 0,
          todayMeanExpectedPointsLoss: null,
          todayOptimalDecisions: 0,
        }}
      />,
    );

    expect(container.textContent).toBe("");
  });
});
