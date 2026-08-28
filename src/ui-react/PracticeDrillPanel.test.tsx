import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import {
  PracticeDrillPanel,
  type PracticeDrillPanelProps,
} from "./PracticeDrillPanel";
import { type RenderResult, fireEvent, render } from "@testing-library/react";
import { basePanelArgs, sampleVerdict } from "./PracticeDrillPanel.test.common";
import { describe, expect, it, jest } from "@jest/globals";

const panelElement = (props: PracticeDrillPanelProps): React.JSX.Element => (
  <PracticeDrillPanel
    canCommit={props.canCommit}
    hasNextHand={props.hasNextHand}
    onCommit={props.onCommit}
    onExit={props.onExit}
    onNextHand={props.onNextHand}
    phase={props.phase}
    sortOrder={props.sortOrder}
    verdict={props.verdict}
  />
);

const renderPanel = (
  overrides: Partial<PracticeDrillPanelProps> = {},
): RenderResult =>
  render(
    panelElement(
      basePanelArgs({
        canCommit: false,
        onCommit: jest.fn(),
        onExit: jest.fn(),
        onNextHand: jest.fn(),
        ...overrides,
      }),
    ),
  );

describe("practiceDrillPanel", () => {
  it("keeps Check discard disabled until two cards are discarded", () => {
    const { getByRole, rerender } = renderPanel();

    expect(getByRole("button", { name: "Check discard" })).toBeDisabled();

    rerender(panelElement(basePanelArgs({ canCommit: true })));

    expect(getByRole("button", { name: "Check discard" })).toBeEnabled();
  });

  it("commits and exits from the choosing phase", () => {
    const onCommit = jest.fn();
    const onExit = jest.fn();
    const { getByRole } = renderPanel({ canCommit: true, onCommit, onExit });

    fireEvent.click(getByRole("button", { name: "Check discard" }));
    fireEvent.click(getByRole("button", { name: "Exit drill" }));

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("shows an interim message after commit while the answer loads", () => {
    const { getByText } = renderPanel({ phase: "revealed", verdict: null });

    expect(getByText("Checking your discard…")).toBeInTheDocument();
  });

  it("reports an optimal choice and its mastery progress", () => {
    const { getByText, getByRole } = renderPanel({
      phase: "revealed",
      verdict: sampleVerdict(),
    });

    expect(getByText("Optimal — 1 of 2 toward mastery.")).toBeInTheDocument();
    expect(getByRole("button", { name: "Draw another" })).toBeInTheDocument();
  });

  it("announces mastery and hides Draw another when nothing remains", () => {
    const { getByText, queryByRole } = renderPanel({
      hasNextHand: false,
      phase: "revealed",
      verdict: sampleVerdict({ consecutiveSuccesses: 2, isMastered: true }),
    });

    expect(getByText("Mastered.")).toBeInTheDocument();
    expect(
      queryByRole("button", { name: "Draw another" }),
    ).not.toBeInTheDocument();
  });

  it("shows the signed loss and a missing previous discard on a miss", () => {
    const { getByText } = renderPanel({
      phase: "revealed",
      verdict: sampleVerdict({
        chosenLoss: 0.42,
        isOptimal: false,
        previousDiscard: null,
      }),
    });

    expect(
      getByText("0.42 behind the best discard — streak reset."),
    ).toBeInTheDocument();
    expect(getByText("not recorded")).toBeInTheDocument();
  });

  it("draws the next hand when asked", () => {
    const onNextHand = jest.fn();
    const { getByRole } = renderPanel({
      onNextHand,
      phase: "revealed",
      verdict: sampleVerdict(),
    });

    fireEvent.click(getByRole("button", { name: "Draw another" }));

    expect(onNextHand).toHaveBeenCalledTimes(1);
  });
});
