/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import {
  MISTAKE_RECORD,
  OPTIMAL_RECORD,
  WITHIN_NOISE_RECORD,
  settledSource,
} from "../ui/noiseVerdicts.test.common";
import { describe, expect, it } from "@jest/globals";
import {
  expectedCribPointsTable,
  expectedPlayPointsTable,
} from "../analysis/analysis.test.common";
import { fireEvent, render, waitFor, within } from "@testing-library/react";
import type { DiscardDecisionRecord } from "../ui/discardTally";
import { DiscardTallyView } from "./DiscardTallyView";
import { type UncertaintySource } from "../game/uncertaintyLoader";
import { noiseTallyProps } from "./discardTally.test.common";
import { rejectingUncertainty } from "../game/uncertaintySidecar.test.common";
import { setTableSync as setPlayTableSync } from "../game/expectedPlayPointsTableLoader";
import { setTableSync } from "../game/expectedCribPointsTableLoader";
/* jscpd:ignore-end */

// Explicit because findBy/waitFor default to one second and testTimeout does not govern them (AGENTS.md).
const WAIT = { timeout: 8000 };

// Period, Decisions, Avg loss, Optimal, Skipped.
const OPTIMAL_COLUMN = 3;

const renderTally = (
  records: readonly DiscardDecisionRecord[],
  crib?: UncertaintySource,
  play?: UncertaintySource,
) => {
  setTableSync(expectedCribPointsTable);
  setPlayTableSync(expectedPlayPointsTable);
  const props = noiseTallyProps(records, crib, play);
  return render(
    <DiscardTallyView
      cribUncertaintySource={props.cribUncertaintySource}
      playUncertaintySource={props.playUncertaintySource}
      summary={props.summary}
      tally={props.tally}
    />,
  );
};

type View = ReturnType<typeof renderTally>;

const ALL_THREE = [OPTIMAL_RECORD, WITHIN_NOISE_RECORD, MISTAKE_RECORD];

// The tally is busy while the verdicts wait, so a figure that must not change is read only once it is not.
const verdictsSettled = async (view: View): Promise<void> => {
  await waitFor(() => {
    expect(view.container.firstElementChild).toHaveAttribute(
      "aria-busy",
      "false",
    );
  }, WAIT);
};

const openTrend = async (view: View): Promise<void> => {
  await verdictsSettled(view);
  fireEvent.click(view.getByRole("button", { name: "Quality trend" }));
};

const summaryCardValue = (
  view: View,
  dialog: string,
  label: string,
): string | null =>
  within(view.getByRole("region", { name: dialog })).getByText(label)
    .nextElementSibling?.textContent ?? null;

describe("noise-aware tally, queue and trend (#774)", () => {
  it("takes a within-noise decision out of both sides of Best choice", async () => {
    const view = renderTally(ALL_THREE);

    // Today and all time, each 1 best of 2 counted: the within-noise decision is in neither count.
    await expect(view.findAllByText("1/2", {}, WAIT)).resolves.toHaveLength(2);
  });

  it("keeps the exact Best choice when a sidecar is unavailable", async () => {
    const view = renderTally(
      ALL_THREE,
      rejectingUncertainty(),
      settledSource(Number.MAX_SAFE_INTEGER),
    );
    await verdictsSettled(view);

    expect(view.getAllByText("1/3")).toHaveLength(2);
  });

  it("hides the Mistake queue button when every mistake is within noise", async () => {
    const view = renderTally([OPTIMAL_RECORD, WITHIN_NOISE_RECORD]);
    await verdictsSettled(view);

    expect(view.queryByRole("button", { name: "Mistake queue" })).toBeNull();
  });

  it("lists only the mistakes outside the noise in the queue", async () => {
    const view = renderTally(ALL_THREE);
    await verdictsSettled(view);
    fireEvent.click(view.getByRole("button", { name: "Mistake queue" }));

    expect(summaryCardValue(view, "Mistake queue", "Total mistakes")).toBe("1");
  });

  it("marks a within-noise point neutral and leaves it out of the rolling Best choice", async () => {
    const view = renderTally(ALL_THREE);
    await openTrend(view);

    expect(
      summaryCardValue(view, "Decision quality over time", "Best choice"),
    ).toBe("50.0%");
    expect(
      view.getByRole("button", {
        name: "Decision #2: 0.09 points loss, within simulation noise. Select to see the hand.",
      }),
    ).toBeInTheDocument();
  });

  it("leaves a within-noise decision out of each calendar period's Optimal share", async () => {
    const view = renderTally(ALL_THREE);
    await openTrend(view);
    fireEvent.click(view.getByRole("radio", { name: "Day" }));

    const optimalCell = view.getByRole("cell", { name: "Today" }).parentElement
      ?.children[OPTIMAL_COLUMN];

    expect(optimalCell).toHaveTextContent("50.0%");
  });
});
