/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import * as classes from "./DecisionQualityTrendDialog.module.css";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { DecisionQualityTrendDialog } from "./DecisionQualityTrendDialog";
import { type StoredTally } from "../ui/discardTally";

const sampleTally: StoredTally = {
  lifetime: {
    decisions: 25,
    expectedPointsLossTotal: 5.0,
    optimalDecisions: 15,
    skippedHands: 2,
  },
  records: Array.from({ length: 25 }, (_, index) => ({
    at: 1700000000000 + index * 3600000,
    cribRole: index % 2 === 0 ? CribRole.Dealer : CribRole.Pone,
    expectedPointsLoss: 0.2,
    handKey: `h-${index}`,
    isOptimal: index % 2 === 0,
    isPractice: false,
  })),
  revision: 1,
  skipped: [{ at: 1700000000000 + 10000 }],
  version: 1,
};

const tallyWithSkipOnlyPeriod: StoredTally = {
  lifetime: {
    decisions: 1,
    expectedPointsLossTotal: 0.5,
    optimalDecisions: 0,
    skippedHands: 1,
  },
  records: [
    {
      at: 1700000000000,
      cribRole: CribRole.Dealer,
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

const emptyTally: StoredTally = {
  lifetime: {
    decisions: 0,
    expectedPointsLossTotal: 0,
    optimalDecisions: 0,
    skippedHands: 0,
  },
  records: [],
  revision: 1,
  skipped: [],
  version: 1,
};

const cappedTally: StoredTally = {
  lifetime: {
    decisions: 20000,
    expectedPointsLossTotal: 4000,
    optimalDecisions: 10000,
    skippedHands: 0,
  },
  records: Array.from({ length: 20000 }, (_, index) => ({
    at: 1700000000000 + index * 1000,
    cribRole: CribRole.Dealer,
    expectedPointsLoss: 0.2,
    handKey: `cap-${index}`,
    isOptimal: true,
    isPractice: false,
  })),
  revision: 1,
  skipped: [],
  version: 1,
};

describe("decision quality trend dialog", () => {
  it("does not render content when show is false", () => {
    const { queryByRole } = render(
      <DecisionQualityTrendDialog
        onClose={jest.fn()}
        show={false}
        tally={sampleTally}
      />,
    );

    expect(
      queryByRole("heading", { name: "Decision quality over time" }),
    ).toBeNull();
  });

  it("renders summary metrics, controls, chart, and breakdown table when open", () => {
    const { getByRole, getByText } = render(
      <DecisionQualityTrendDialog
        onClose={jest.fn()}
        show
        tally={sampleTally}
      />,
    );

    expect(
      getByRole("heading", { name: "Decision quality over time" }),
    ).toBeInTheDocument();
    expect(getByText("Decisions 1–20")).toBeInTheDocument();
    expect(getByRole("radio", { name: "Rolling 20" })).toBeChecked();
    expect(getByRole("radio", { name: "All" })).toBeChecked();
  });

  it("explains the metric and shows the skipped-hand rate", () => {
    const { getByText } = render(
      <DecisionQualityTrendDialog
        onClose={jest.fn()}
        show
        tally={sampleTally}
      />,
    );

    expect(
      getByText(/Average loss is the expected points left on the table/iu),
    ).toBeInTheDocument();
    expect(getByText("1 (4.8%)")).toBeInTheDocument();
  });

  it("switches granularity when another radio is selected", () => {
    const { getByRole } = render(
      <DecisionQualityTrendDialog
        onClose={jest.fn()}
        show
        tally={sampleTally}
      />,
    );

    const dayRadio = getByRole("radio", { name: "Day" });
    fireEvent.click(dayRadio);

    expect(dayRadio).toBeChecked();
  });

  it("filters by crib role when role filter is changed", () => {
    const { getByRole } = render(
      <DecisionQualityTrendDialog
        onClose={jest.fn()}
        show
        tally={sampleTally}
      />,
    );

    const dealerRadio = getByRole("radio", { name: "Dealer" });
    fireEvent.click(dealerRadio);

    expect(dealerRadio).toBeChecked();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = jest.fn();
    render(
      <DecisionQualityTrendDialog
        onClose={onClose}
        show
        tally={sampleTally}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores keyboard events other than Escape", () => {
    const onClose = jest.fn();
    render(
      <DecisionQualityTrendDialog
        onClose={onClose}
        show
        tally={sampleTally}
      />,
    );

    fireEvent.keyDown(document, { key: "Enter" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Close modal button is clicked", () => {
    const onClose = jest.fn();
    const { getByRole } = render(
      <DecisionQualityTrendDialog
        onClose={onClose}
        show
        tally={sampleTally}
      />,
    );

    fireEvent.click(getByRole("button", { name: "Close modal" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays horizon notice when tally reaches record cap", () => {
    const { getByText } = render(
      <DecisionQualityTrendDialog
        onClose={jest.fn()}
        show
        tally={cappedTally}
      />,
    );

    expect(getByText(/retain up to 20,000 entries/iu)).toBeInTheDocument();
  });

  it("renders cleanly with empty tally", () => {
    const { getByText } = render(
      <DecisionQualityTrendDialog
        onClose={jest.fn()}
        show
        tally={emptyTally}
      />,
    );

    expect(
      getByText("No discard decisions recorded yet for this view."),
    ).toBeInTheDocument();
  });

  it("renders periods with skipped hands and no decisions in day view", () => {
    const { getAllByText } = render(
      <DecisionQualityTrendDialog
        initialGranularity="day"
        onClose={jest.fn()}
        show
        tally={tallyWithSkipOnlyPeriod}
      />,
    );

    expect(getAllByText("—").length).toBeGreaterThan(0);
  });

  it("reads from storage helper when tally prop is omitted", () => {
    const { getByRole } = render(
      <DecisionQualityTrendDialog
        onClose={jest.fn()}
        show
      />,
    );

    expect(
      getByRole("heading", { name: "Decision quality over time" }),
    ).toBeInTheDocument();
  });

  it("renders distinct loss pill classes across all loss severity tiers", () => {
    const multiTierTally: StoredTally = {
      lifetime: {
        decisions: 5,
        expectedPointsLossTotal: 2.8,
        optimalDecisions: 1,
        skippedHands: 0,
      },
      records: [
        {
          at: 1700000000000,
          cribRole: CribRole.Dealer,
          expectedPointsLoss: 0,
          handKey: "h-opt",
          isOptimal: true,
          isPractice: false,
        },
        {
          at: 1700000000000 + 86400000,
          cribRole: CribRole.Dealer,
          expectedPointsLoss: 0.15,
          handKey: "h-minor",
          isOptimal: false,
          isPractice: false,
        },
        {
          at: 1700000000000 + 86400000 * 2,
          cribRole: CribRole.Dealer,
          expectedPointsLoss: 0.35,
          handKey: "h-inside",
          isOptimal: false,
          isPractice: false,
        },
        {
          at: 1700000000000 + 86400000 * 3,
          cribRole: CribRole.Dealer,
          expectedPointsLoss: 0.75,
          handKey: "h-open",
          isOptimal: false,
          isPractice: false,
        },
        {
          at: 1700000000000 + 86400000 * 4,
          cribRole: CribRole.Dealer,
          expectedPointsLoss: 1.55,
          handKey: "h-blunder",
          isOptimal: false,
          isPractice: false,
        },
      ],
      revision: 1,
      skipped: [],
      version: 1,
    };

    const { getByText } = render(
      <DecisionQualityTrendDialog
        initialGranularity="day"
        onClose={jest.fn()}
        show
        tally={multiTierTally}
      />,
    );

    expect(getByText("0.00")).toHaveClass(classes.lossPillOptimal);
    expect(getByText("0.15")).toHaveClass(classes.lossPillMinor);
    expect(getByText("0.35")).toHaveClass(classes.lossPillInside);
    expect(getByText("0.75")).toHaveClass(classes.lossPillOpen);
    expect(getByText("1.55")).toHaveClass(classes.lossPillBlunder);
  });
});
/* jscpd:ignore-end */
