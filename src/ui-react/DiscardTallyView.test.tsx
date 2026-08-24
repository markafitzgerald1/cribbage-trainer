import { describe, expect, it } from "@jest/globals";
import { DiscardTallyView } from "./DiscardTallyView";
import { discardTallySummary } from "./discardTally.test.common";
import { render } from "@testing-library/react";

// Typed from the builder rather than from the summary, so this file does not restate an import the stories already make.
const renderTally = (overrides: Parameters<typeof discardTallySummary>[0]) =>
  render(<DiscardTallyView summary={discardTallySummary(overrides)} />);

const NOTHING_SCORED = {
  decisions: 0,
  meanExpectedPointsLoss: null,
  optimalDecisions: 0,
};

describe("discard tally view", () => {
  /*
   * Today is named once as a column heading rather than beside every figure,
   * and the column exists only when today has something in it. A zero there
   * would read as a day played faultlessly rather than one not played.
   */
  it.each([
    { name: "a decision made today", scoped: 1, today: { todayDecisions: 5 } },
    // A skip counts as facing a hand, so it earns the column on its own.
    { name: "a skip alone", scoped: 1, today: { todaySkippedHands: 1 } },
    { name: "nothing faced today", scoped: 0, today: {} },
  ])("gives today a column for $name", ({ scoped, today }) => {
    const { queryAllByText } = renderTally({ skippedHands: 3, ...today });

    expect(queryAllByText("today")).toHaveLength(scoped);
  });

  /*
   * The skip row appears only once a hand has been abandoned, so an untouched
   * account never implies a habit nobody has.
   */
  it.each([
    { name: "some were skipped", rows: 1, skippedHands: 3 },
    { name: "none were", rows: 0, skippedHands: 0 },
  ])("shows the skip row when $name", ({ rows, skippedHands }) => {
    const { queryAllByText } = renderTally({ skippedHands });

    expect(queryAllByText("Hands skipped")).toHaveLength(rows);
  });

  /*
   * A player who has only walked away from hands is exactly who the skip row
   * was added for, so it shows without any decision to average beside it, and
   * the decision rows are absent rather than showing a misleading zero.
   */
  it("shows skips alone when nothing has been scored", () => {
    const { queryByText } = renderTally({
      ...NOTHING_SCORED,
      skippedHands: 2,
      todaySkippedHands: 2,
    });

    expect(queryByText("Hands skipped")).not.toBeNull();
    expect(queryByText("Points lost per discard")).toBeNull();
  });

  it("says nothing at all before a hand has been faced", () => {
    const { container } = renderTally(NOTHING_SCORED);

    expect(container.textContent).toBe("");
  });
});
