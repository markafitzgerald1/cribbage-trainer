/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import type * as Tally from "../ui/discardTally";
import * as classes from "./DecisionQualityTrendDialog.module.css";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { DecisionQualityTrendDialog } from "./DecisionQualityTrendDialog";
import type { DiscardTrendGranularity } from "../ui/discardQualityTrend";
import dialogFixtures from "./DecisionQualityTrendDialog.test.common";
/* jscpd:ignore-end */

const sampleTally = dialogFixtures.dialogTally(25);
const tallyWithSkipOnlyPeriod = dialogFixtures.skipOnlyDialogTally();
const emptyTally = dialogFixtures.emptyDialogTally();
const cappedTally = dialogFixtures.cappedDialogTally();
const multiLossTally = dialogFixtures.multiLossDialogTally();

interface RenderDialogOptions {
  readonly initialGranularity?: DiscardTrendGranularity;
  readonly onClose?: () => void;
  readonly show?: boolean;
  readonly tally?: Tally.StoredTally | null;
  readonly useStoredTally?: boolean;
}

const renderDialog = ({
  initialGranularity,
  onClose = jest.fn(),
  show = true,
  tally = sampleTally,
  useStoredTally = false,
}: RenderDialogOptions = {}) =>
  useStoredTally
    ? render(
        <DecisionQualityTrendDialog
          onClose={onClose}
          show={show}
        />,
      )
    : render(
        <DecisionQualityTrendDialog
          initialGranularity={initialGranularity}
          onClose={onClose}
          show={show}
          tally={tally}
        />,
      );

const clickRadio = (
  rendered: ReturnType<typeof renderDialog>,
  name: RegExp | string,
) => {
  const radio = rendered.getByRole("radio", { name });
  fireEvent.click(radio);
  return radio;
};

describe("decision quality trend dialog", () => {
  it("renders nothing when closed", () => {
    const closedView = renderDialog({ show: false });

    expect(closedView.container.textContent).toBe("");
  });

  it("renders summary metrics, controls, chart, and breakdown table when open", () => {
    const { getAllByText, getByRole } = renderDialog();

    expect(
      getByRole("heading", { name: "Decision quality over time" }),
    ).toBeInTheDocument();
    expect(getAllByText("Decisions").length).toBeGreaterThan(0);
    expect(getByRole("group", { name: "Granularity" })).toBeInTheDocument();
    expect(getByRole("group", { name: "Crib role" })).toBeInTheDocument();
    expect(
      getByRole("img", { name: /Decision quality over time/iu }),
    ).toBeInTheDocument();
  });

  it("switches granularity when time frame radio buttons are clicked", () => {
    const rendered = renderDialog();

    const dayRadio = clickRadio(rendered, "Day");

    expect(dayRadio).toBeChecked();

    const weekRadio = clickRadio(rendered, "Week");

    expect(weekRadio).toBeChecked();

    const monthRadio = clickRadio(rendered, "Month");

    expect(monthRadio).toBeChecked();

    const rollingRadio = clickRadio(rendered, "Rolling 20");

    expect(rollingRadio).toBeChecked();
  });

  it("switches role filter when crib role radio buttons are clicked", () => {
    const rendered = renderDialog();

    const dealerRadio = clickRadio(rendered, "Dealer");

    expect(dealerRadio).toBeChecked();

    const poneRadio = clickRadio(rendered, "Pone");

    expect(poneRadio).toBeChecked();

    const allRadio = clickRadio(rendered, "All roles");

    expect(allRadio).toBeChecked();
  });

  it.each([
    { expectedCalls: 1, key: "Escape" },
    { expectedCalls: 0, key: "Enter" },
  ])("handles $key keydown to close or keep open", ({ expectedCalls, key }) => {
    const onClose = jest.fn();
    renderDialog({ onClose });

    fireEvent.keyDown(document, { key });

    expect(onClose).toHaveBeenCalledTimes(expectedCalls);
  });

  it("calls onClose when Close modal button is clicked", () => {
    const onClose = jest.fn();
    const { getByRole } = renderDialog({ onClose });
    const closeBtn = getByRole("button", { name: "Close modal" });

    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays horizon notice when tally reaches record cap", () => {
    const { getByText } = renderDialog({ tally: cappedTally });

    expect(getByText(/retain up to 10,000 entries/iu)).toBeInTheDocument();
  });

  it("renders cleanly with empty tally", () => {
    const { getByText } = renderDialog({ tally: emptyTally });

    expect(
      getByText("No discard decisions recorded yet for this view."),
    ).toBeInTheDocument();
  });

  it("renders periods with skipped hands and no decisions in day view", () => {
    const { getAllByText } = renderDialog({
      initialGranularity: "day",
      tally: tallyWithSkipOnlyPeriod,
    });

    expect(getAllByText("—").length).toBeGreaterThan(0);
  });

  it("reads from storage helper when tally prop is omitted", () => {
    const { getByRole } = renderDialog({ useStoredTally: true });

    expect(
      getByRole("heading", { name: "Decision quality over time" }),
    ).toBeInTheDocument();
  });

  it("renders optimal loss pill class for optimal decisions", () => {
    const { getByText } = renderDialog({
      initialGranularity: "day",
      tally: multiLossTally,
    });

    expect(getByText("0.00")).toHaveClass(classes.lossPillOptimal);
    expect(getByText("0.15")).toHaveClass(classes.lossPill);
    expect(getByText("0.15")).not.toHaveClass(classes.lossPillOptimal);
  });

  it("renders rolling chart horizon disclosure when decisions exceed 100", () => {
    const { getByText } = renderDialog({
      initialGranularity: "rolling20",
      tally: dialogFixtures.dialogTally(120),
    });

    expect(
      getByText(
        "The rolling chart displays the most recent 100 decisions with their trailing moving average.",
      ),
    ).toBeInTheDocument();
  });
});
