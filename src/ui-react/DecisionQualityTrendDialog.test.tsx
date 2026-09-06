/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import * as classes from "./DecisionQualityTrendDialog.module.css";
import { type StoredTally, discardTallyKey } from "../ui/discardTally";
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
  readonly onStartDrill?: ((item: unknown) => void) | null;
  readonly show?: boolean;
  readonly tally?: StoredTally | null;
  readonly useStoredTally?: boolean;
}

const renderDialog = ({
  initialGranularity,
  onClose = jest.fn(),
  onStartDrill = null,
  show = true,
  tally = sampleTally,
  useStoredTally = false,
}: RenderDialogOptions = {}) =>
  useStoredTally
    ? render(
        <DecisionQualityTrendDialog
          onClose={onClose}
          onStartDrill={onStartDrill}
          show={show}
        />,
      )
    : render(
        <DecisionQualityTrendDialog
          initialGranularity={initialGranularity}
          onClose={onClose}
          onStartDrill={onStartDrill}
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

type Rendered = ReturnType<typeof renderDialog>;

const clickMarker = (rendered: Rendered, ordinal: number) =>
  fireEvent.click(
    rendered.container.querySelector(
      `[data-decision-ordinal="${ordinal}"]`,
    ) as Element,
  );

const practiceButton = "Practice this hand";

const clickPractice = (rendered: Rendered) =>
  fireEvent.click(rendered.getByRole("button", { name: practiceButton }));

const practiceFromMarker = (ordinal: number, useStoredTally = false) => {
  const onStartDrill = jest.fn<(item: unknown) => void>();
  const rendered = renderDialog(
    useStoredTally
      ? { onStartDrill, useStoredTally }
      : { onStartDrill, tally: dialogFixtures.practiceReadyDialogTally() },
  );
  clickMarker(rendered, ordinal);
  clickPractice(rendered);
  return onStartDrill;
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
    expect(getByRole("group", { name: /trend chart/iu })).toBeInTheDocument();
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

  it("starts a drill on the hand behind a tapped chart mistake", () => {
    expect(practiceFromMarker(1)).toHaveBeenCalledWith(
      expect.objectContaining({ handKey: "5H,6H,7H,8H,9H,10H|Dealer" }),
    );
  });

  it("does nothing when the tapped mistake is not in the queue", () => {
    // Ordinal 3 is the zero-loss non-optimal record the queue excludes.
    expect(practiceFromMarker(3)).not.toHaveBeenCalled();
  });

  it("omits the chart practice button when onStartDrill is left to default", () => {
    // Rendered directly, bypassing renderDialog's explicit null prop.
    // The component's own onStartDrill default is what hides the button here.
    const rendered = render(
      <DecisionQualityTrendDialog
        onClose={jest.fn()}
        show
        tally={dialogFixtures.practiceReadyDialogTally()}
      />,
    );

    clickMarker(rendered, 1);

    expect(rendered.queryByRole("button", { name: practiceButton })).toBeNull();
  });

  it("resolves the practice hand from stored history when no tally prop", () => {
    localStorage.setItem(
      discardTallyKey,
      JSON.stringify(dialogFixtures.practiceReadyDialogTally()),
    );
    const onStartDrill = practiceFromMarker(1, true);
    localStorage.clear();

    expect(onStartDrill).toHaveBeenCalledWith(
      expect.objectContaining({ handKey: "5H,6H,7H,8H,9H,10H|Dealer" }),
    );
  });
});
