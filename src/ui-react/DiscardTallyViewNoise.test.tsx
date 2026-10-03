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
import { ONE_DAY_MS } from "../ui/mistakeQueue.test.common";
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
      hasShownRecommendation={props.hasShownRecommendation}
      playUncertaintySource={props.playUncertaintySource}
      summary={props.summary}
      tally={props.tally}
    />,
  );
};

type View = ReturnType<typeof renderTally>;

const ALL_THREE = [OPTIMAL_RECORD, WITHIN_NOISE_RECORD, MISTAKE_RECORD];

// The tally is busy only while the sidecars load; judging after that updates each figure in place.
const eventually = (assertion: () => void): Promise<void> =>
  waitFor(assertion, WAIT);

const sidecarsSettled = (view: View) =>
  eventually(() => {
    expect(view.container.firstElementChild).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });

// Today and all time, each 1 best of 2 counted: the within-noise decision is in neither count.
const bestChoiceOfTwo = (view: View) =>
  eventually(() => {
    expect(view.getAllByText("1/2")).toHaveLength(2);
  });

const openTrend = async (view: View): Promise<void> => {
  await bestChoiceOfTwo(view);
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
    await expect(
      bestChoiceOfTwo(renderTally(ALL_THREE)),
    ).resolves.toBeUndefined();
  });

  // Two days back, so no daylight-saving day can fold it into today.
  it("takes only today's within-noise decisions out of today's count", async () => {
    const view = renderTally([
      { ...WITHIN_NOISE_RECORD, at: Date.now() - 2 * ONE_DAY_MS },
      OPTIMAL_RECORD,
      MISTAKE_RECORD,
    ]);

    await expect(bestChoiceOfTwo(view)).resolves.toBeUndefined();
  });

  it("keeps the exact Best choice when a sidecar is unavailable", async () => {
    const view = renderTally(
      ALL_THREE,
      rejectingUncertainty(),
      settledSource(Number.MAX_SAFE_INTEGER),
    );
    await sidecarsSettled(view);

    expect(view.getAllByText("1/3")).toHaveLength(2);
  });

  it("hides the Mistake queue button when every mistake is within noise", async () => {
    const view = renderTally([OPTIMAL_RECORD, WITHIN_NOISE_RECORD]);

    await eventually(() => {
      expect(view.queryByRole("button", { name: "Mistake queue" })).toBeNull();
    });

    expect(view.getAllByText("1/1")).toHaveLength(2);
  });

  // Opened while its one mistake still has the exact verdict, so the noise empties it in place.
  it("says the noise emptied an open queue, not that its mistakes aged out", async () => {
    const view = renderTally([OPTIMAL_RECORD, WITHIN_NOISE_RECORD]);
    fireEvent.click(view.getByRole("button", { name: "Mistake queue" }));

    await expect(
      view.findByText(/within simulation noise/u, {}, WAIT),
    ).resolves.toBeInTheDocument();
    expect(view.queryByText(/aged out/u)).toBeNull();
  });

  it("names a within-noise point by its recomputed loss beside the recorded one", async () => {
    const view = renderTally([
      OPTIMAL_RECORD,
      { ...WITHIN_NOISE_RECORD, expectedPointsLoss: 5 },
      MISTAKE_RECORD,
    ]);
    await openTrend(view);

    expect(
      view.getByRole("button", {
        name: "Decision #2: 0.09 points loss (5.00 recorded), within simulation noise. Select to see the hand.",
      }),
    ).toBeInTheDocument();
  });

  it("lists only the mistakes outside the noise in the queue", async () => {
    const view = renderTally(ALL_THREE);
    await bestChoiceOfTwo(view);
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
