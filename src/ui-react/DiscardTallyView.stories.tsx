/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  RECORDED_MISTAKE,
  RECORDED_OPTIMAL,
  RECORDED_WITHIN_NOISE,
  recordedTally,
} from "./discardTallyNoise.test.common";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import type { DiscardTallySummary } from "../ui/discardTally";
import { DiscardTallyView } from "./DiscardTallyView";
import { createSampleMistakeTally } from "./MistakeQueueDialog.test.common";
import { discardTallySummary } from "./discardTally.test.common";
import { playPracticeFromDecisionMarker } from "./stories.common";
/* jscpd:ignore-end */

const sampleMistakeTally = createSampleMistakeTally();

const meta = {
  component: DiscardTallyView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "DiscardTallyView",
} satisfies Meta<typeof DiscardTallyView>;

export default meta;

/*
 * Each story asserts one figure it alone produces. The figures sit in
 * separate elements for styling, and this matcher will not join text across
 * them the way a browser-level one does.
 */
const showing = (
  summary: DiscardTallySummary,
  figure: string,
): StoryObj<typeof meta> => ({
  args: { summary },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(figure)).toBeVisible();
  },
});

export const Default = showing(
  discardTallySummary({
    todayDecisions: 5,
    todayMeanExpectedPointsLoss: 0.4128,
    todayOptimalDecisions: 2,
  }),
  "0.41",
);

// A player who has always taken the top option still has an average, and it is zero rather than absent.
export const FaultlessSoFar = showing(
  discardTallySummary({
    decisions: 3,
    meanExpectedPointsLoss: 0,
    optimalDecisions: 3,
  }),
  "0.00",
);

/*
 * Hands dealt and left without a discard. The row exists so the averages
 * above stay honest about what they leave out: a player who abandons the
 * hands they find hard would otherwise post a better average for it.
 */
export const WithSkippedHands = showing(
  discardTallySummary({
    skippedHands: 7,
    todayDecisions: 5,
    todayMeanExpectedPointsLoss: 0.4128,
    todayOptimalDecisions: 2,
    todaySkippedHands: 3,
  }),
  "Hands skipped",
);

/*
 * Nothing is shown before a hand has been either played or walked away from.
 * A zero would read as faultless play rather than as an absence of evidence.
 */
export const NothingFacedYet: StoryObj<typeof meta> = {
  args: {
    summary: discardTallySummary({
      decisions: 0,
      meanExpectedPointsLoss: null,
      optimalDecisions: 0,
    }),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe("");
  },
};

const summaryWithMistakes = discardTallySummary({
  decisions: 10,
  meanExpectedPointsLoss: 0.25,
  optimalDecisions: 7,
});

export const OpenQualityTrend: StoryObj<typeof meta> = {
  args: {
    summary: summaryWithMistakes,
  },
  play: async ({ canvas }) => {
    const trendButton = canvas.getByRole("button", { name: "Quality trend" });

    await expect(trendButton).toBeVisible();

    await userEvent.click(trendButton);

    await expect(canvas.getByText("Decision quality over time")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Close modal" }));

    await expect(canvas.queryByText("Decision quality over time")).toBeNull();
  },
};

export const OpenMistakeQueue: StoryObj<typeof meta> = {
  args: {
    summary: summaryWithMistakes,
    tally: sampleMistakeTally,
  },
  play: async ({ canvas }) => {
    const queueButton = canvas.getByRole("button", { name: "Mistake queue" });

    await expect(queueButton).toBeVisible();

    await userEvent.click(queueButton);

    await expect(
      canvas.getByRole("heading", { name: "Mistake queue" }),
    ).toBeVisible();

    // Classification runs in chunks after the dialog opens; wait for both recorded discards.
    await waitFor(
      async () => {
        await expect(
          canvas.getAllByRole("note", { name: /^Current-table comparison:/u }),
        ).toHaveLength(2);
      },
      { timeout: 10000 },
    );
  },
};

export const RecordedSmallLoss: StoryObj<typeof meta> = {
  args: { summary: discardTallySummary({ meanExpectedPointsLoss: 0.004 }) },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("note", {
        name: "Recorded loss all time: less than 0.01 points per discard",
      }),
    ).toHaveTextContent("< 0.01");

    await userEvent.click(canvas.getByText("As recorded"));

    await expect(
      canvas.getByText(
        /Earlier results, queue membership and mastery are kept/u,
      ),
    ).toBeVisible();
  },
};

export const OnlySkippedToday = showing(
  discardTallySummary({ skippedHands: 2, todaySkippedHands: 1 }),
  "1/1",
);

export const StartAutomaticDrill: StoryObj<typeof meta> = {
  args: {
    ...OpenMistakeQueue.args,
    onStartAutoDrill: fn(),
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Mistake queue" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Start drill" }));

    await expect(args.onStartAutoDrill).toHaveBeenCalledTimes(1);
    await expect(
      canvas.queryByRole("heading", { name: "Mistake queue" }),
    ).toBeNull();
  },
};

export const PracticeClosesTrend: StoryObj<typeof meta> = {
  args: {
    ...OpenMistakeQueue.args,
    onStartDrill: fn(),
  },
  play: async ({ args, canvas, canvasElement }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Quality trend" }),
    );
    await playPracticeFromDecisionMarker(canvasElement, args.onStartDrill);

    await expect(canvas.queryByRole("region")).toBeNull();
    await expect(canvas.queryByText("Decision quality over time")).toBeNull();
  },
};

/*
 * #774: a decision whose recorded admission says its loss was within
 * simulation noise. It leaves both sides of Best choice, the queue and the
 * trend's shares, read from what was recorded rather than re-judged.
 */
const ALL_THREE = [RECORDED_OPTIMAL, RECORDED_WITHIN_NOISE, RECORDED_MISTAKE];
// One best choice and one decision recorded as within noise, among `decisions`.
const oneWithinNoise = (decisions: number, meanExpectedPointsLoss: number) =>
  discardTallySummary({
    decisions,
    meanExpectedPointsLoss,
    optimalDecisions: 1,
    withinNoiseDecisions: 1,
  });
const allThreeSummary = oneWithinNoise(3, 0.5137);

export const WithinNoiseLeftOutOfBestChoice = showing(allThreeSummary, "1/2");

export const EveryMistakeWithinNoise: StoryObj<typeof meta> = {
  args: {
    summary: oneWithinNoise(2, 0.0205),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("1/1")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Mistake queue" }),
    ).not.toBeInTheDocument();
  },
};

export const WithinNoiseInQualityTrend: StoryObj<typeof meta> = {
  args: { summary: allThreeSummary, tally: recordedTally(ALL_THREE) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("1/2")).toBeVisible();

    await userEvent.click(
      canvas.getByRole("button", { name: "Quality trend" }),
    );

    // The Best choice card and the one rolling batch's row agree.
    await expect(canvas.getAllByText("50.0%")).toHaveLength(2);

    canvas
      .getByRole("button", {
        name: "Decision #2, recorded cost 0.04 points, within simulation noise. Select to see the hand.",
      })
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    await expect(await canvas.findByText("Within noise")).toBeVisible();
  },
};
