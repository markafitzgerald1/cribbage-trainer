/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { clearDiscardTally, recordDiscardDecision } from "../ui/discardTally";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { DiscardTallyView } from "./DiscardTallyView";
import { SortOrder } from "../ui/SortOrder";
import { discardTallySummary } from "./discardTally.test.common";
/* jscpd:ignore-end */

const renderTally = (summary: Parameters<typeof discardTallySummary>[0]) =>
  render(<DiscardTallyView summary={discardTallySummary(summary)} />);

const NOTHING_SCORED = {
  decisions: 0,
  meanExpectedPointsLoss: null,
  optimalDecisions: 0,
};

const seedMistakeDecision = () => {
  clearDiscardTally();
  recordDiscardDecision({
    at: 1_700_000_000_000,
    cribRole: CribRole.Dealer,
    discardKey: "5H,6H",
    expectedPointsLoss: 1.5,
    handKey: "5H,6H,7H,8H,9H,10H|Dealer",
    isOptimal: false,
    isPractice: false,
  });
};

const verifyModalOpenAndClose = (
  openButtonName: string,
  headingName: string,
  renderedView: ReturnType<typeof renderTally>,
): boolean => {
  const { getByRole, queryByRole } = renderedView;
  const openButton = getByRole("button", { name: openButtonName });

  fireEvent.click(openButton);

  const headingPresent = queryByRole("heading", { name: headingName }) !== null;

  const closeButton = getByRole("button", { name: "Close modal" });

  fireEvent.click(closeButton);

  const headingClosed = queryByRole("heading", { name: headingName }) === null;

  return headingPresent && headingClosed;
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
    expect(queryByText("Lost per discard")).toBeNull();
  });

  it("says nothing at all before a hand has been faced", () => {
    const { container } = renderTally(NOTHING_SCORED);

    expect(container.textContent).toBe("");
  });

  it("opens and closes the decision quality trend dialog", () => {
    const success = verifyModalOpenAndClose(
      "Quality trend",
      "Decision quality over time",
      renderTally({
        decisions: 5,
        meanExpectedPointsLoss: 0.25,
        optimalDecisions: 3,
      }),
    );

    expect(success).toBe(true);
  });

  it("hides mistake queue button when summary has no sub-optimal decisions", () => {
    clearDiscardTally();
    const { queryByRole } = renderTally({
      decisions: 3,
      meanExpectedPointsLoss: 0,
      optimalDecisions: 3,
    });

    expect(queryByRole("button", { name: "Mistake queue" })).toBeNull();
  });

  it("opens and closes mistake queue dialog when sub-optimal decisions are present", () => {
    seedMistakeDecision();

    const success = verifyModalOpenAndClose(
      "Mistake queue",
      "Mistake queue",
      renderTally({
        decisions: 1,
        meanExpectedPointsLoss: 1.5,
        optimalDecisions: 0,
      }),
    );

    expect(success).toBe(true);
  });

  it("forwards sortOrder to the mistake queue dialog", () => {
    seedMistakeDecision();

    const { container, getByRole } = render(
      <DiscardTallyView
        sortOrder={SortOrder.Descending}
        summary={discardTallySummary({
          decisions: 1,
          meanExpectedPointsLoss: 1.5,
          optimalDecisions: 0,
        })}
      />,
    );

    fireEvent.click(getByRole("button", { name: "Mistake queue" }));

    expect(container).toHaveTextContent("10♥9♥8♥7♥6♥5♥");
    expect(container).toHaveTextContent("Previous discard:6♥5♥");
  });
});
