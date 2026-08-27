/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import type * as Tally from "../ui/discardTally";
import * as classes from "./DecisionQualityTrendDialog.module.css";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { DecisionQualityTrendDialog } from "./DecisionQualityTrendDialog";
import type { DiscardTrendGranularity } from "../ui/discardQualityTrend";
import dialogFixtures from "./DecisionQualityTrendDialog.test.common";

const sampleTally = dialogFixtures.dialogTally(25);

const tallyWithSkipOnlyPeriod: Tally.StoredTally = {
  lifetime: {
    decisions: 1,
    expectedPointsLossTotal: 0.5,
    optimalDecisions: 0,
    skippedHands: 1,
  },
  practice: [],
  records: [
    {
      at: 1700000000000,
      cribRole: CribRole.Dealer,
      discardKey: null,
      expectedPointsLoss: 0.5,
      handKey: "h1",
      isOptimal: false,
      isPractice: false,
    },
  ],
  revision: 1,
  skipped: [{ at: 1700000000000 + 86400000 * 5 }],
  version: 1,
};

const emptyTally: Tally.StoredTally = {
  lifetime: {
    decisions: 0,
    expectedPointsLossTotal: 0,
    optimalDecisions: 0,
    skippedHands: 0,
  },
  practice: [],
  records: [],
  revision: 1,
  skipped: [],
  version: 1,
};

const cappedTally = dialogFixtures.cappedDialogTally();

const multiLossTally: Tally.StoredTally = {
  lifetime: {
    decisions: 5,
    expectedPointsLossTotal: 2.8,
    optimalDecisions: 1,
    skippedHands: 0,
  },
  practice: [],
  records: [
    {
      at: 1700000000000,
      cribRole: CribRole.Dealer,
      discardKey: "5H,6H",
      expectedPointsLoss: 0,
      handKey: "h-opt",
      isOptimal: true,
      isPractice: false,
    },
    {
      at: 1700000000000 + 86400000,
      cribRole: CribRole.Dealer,
      discardKey: "5H,6H",
      expectedPointsLoss: 0.15,
      handKey: "h-1",
      isOptimal: false,
      isPractice: false,
    },
    {
      at: 1700000000000 + 86400000 * 2,
      cribRole: CribRole.Dealer,
      discardKey: "5H,6H",
      expectedPointsLoss: 0.35,
      handKey: "h-2",
      isOptimal: false,
      isPractice: false,
    },
    {
      at: 1700000000000 + 86400000 * 3,
      cribRole: CribRole.Dealer,
      discardKey: "5H,6H",
      expectedPointsLoss: 0.75,
      handKey: "h-3",
      isOptimal: false,
      isPractice: false,
    },
    {
      at: 1700000000000 + 86400000 * 4,
      cribRole: CribRole.Dealer,
      discardKey: "5H,6H",
      expectedPointsLoss: 1.55,
      handKey: "h-4",
      isOptimal: false,
      isPractice: false,
    },
  ],
  revision: 1,
  skipped: [],
  version: 1,
};

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

const selectRadio = (
  getByRole: ReturnType<typeof render>["getByRole"],
  name: "Day" | "Dealer",
) => {
  const radio = getByRole("radio", { name });

  fireEvent.click(radio);
  return radio;
};

describe("decision quality trend dialog", () => {
  it("does not render content when show is false", () => {
    const { container } = renderDialog({ show: false });

    expect(container.textContent).not.toContain("Decision quality over time");
  });

  it("renders summary metrics, controls, chart, and breakdown table when open", () => {
    const { getByRole, getByText } = renderDialog();

    expect(
      getByRole("heading", { name: "Decision quality over time" }),
    ).toBeInTheDocument();
    expect(getByText("Decisions 6–25")).toBeInTheDocument();
    expect(getByText("Decisions 1–5")).toBeInTheDocument();
    expect(getByRole("radio", { name: "Rolling 20" })).toBeChecked();
    expect(getByRole("radio", { name: "All roles" })).toBeChecked();
  });

  it("explains the metric and shows the skipped-hand rate", () => {
    const { getByText } = renderDialog();

    expect(
      getByText(/Average loss is the expected points left on the table/iu),
    ).toBeInTheDocument();
    expect(getByText("1 (16.7%)")).toBeInTheDocument();
    expect(getByText("1 (3.8%)")).toBeInTheDocument();
  });

  it("switches granularity when another radio is selected", () => {
    const { getByRole } = renderDialog();

    expect(selectRadio(getByRole, "Day")).toBeChecked();
  });

  it("filters by crib role when role filter is changed", () => {
    const { getByRole } = renderDialog();

    expect(selectRadio(getByRole, "Dealer")).toBeChecked();
  });

  it.each([
    { expectedCalls: 1, key: "Escape" },
    { expectedCalls: 0, key: "Enter" },
  ])("closes only for the $key key", ({ expectedCalls, key }) => {
    const onClose = jest.fn();
    renderDialog({ onClose });

    fireEvent.keyDown(document, { key });

    expect(onClose).toHaveBeenCalledTimes(expectedCalls);
  });

  it("calls onClose when Close modal button is clicked", () => {
    const onClose = jest.fn();
    const { getByRole } = renderDialog({ onClose });

    fireEvent.click(getByRole("button", { name: "Close modal" }));

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
/* jscpd:ignore-end */
