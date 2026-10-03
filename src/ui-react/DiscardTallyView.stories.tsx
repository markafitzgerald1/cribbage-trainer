/* jscpd:ignore-start */
import {
  type DiscardDecisionRecord,
  type DiscardTallySummary,
} from "../ui/discardTally";
import {
  MISTAKE_RECORD,
  OPTIMAL_RECORD,
  WITHIN_NOISE_RECORD,
} from "../ui/noiseVerdicts.test.common";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  discardTallySummary,
  noiseTallyProps,
} from "./discardTally.test.common";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DiscardTallyView } from "./DiscardTallyView";
import { createSampleMistakeTally } from "./MistakeQueueDialog.test.common";
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
  },
};

/*
 * #774: a decision whose loss is within simulation noise, judged here
 * against sidecars that put every published error at 0.1 points. It leaves
 * both sides of Best choice, the queue and the trend's shares. A figure
 * shows its exact verdict until judged, so each story waits for the change.
 */
const afterVerdicts = (
  records: readonly DiscardDecisionRecord[],
  check: (canvasElement: HTMLElement) => Promise<void>,
): StoryObj<typeof meta> => ({
  args: noiseTallyProps(records),
  play: async ({ canvasElement }) => {
    await waitFor(
      async () => {
        await check(canvasElement);
      },
      { timeout: 8000 },
    );
  },
});

const ALL_THREE = [OPTIMAL_RECORD, WITHIN_NOISE_RECORD, MISTAKE_RECORD];

const bestChoiceOfTwo = async (canvasElement: HTMLElement) => {
  await expect(within(canvasElement).getAllByText("1/2")).toHaveLength(2);
};

export const WithinNoiseLeftOutOfBestChoice = afterVerdicts(
  ALL_THREE,
  bestChoiceOfTwo,
);

export const EveryMistakeWithinNoise = afterVerdicts(
  [OPTIMAL_RECORD, WITHIN_NOISE_RECORD],
  async (canvasElement) => {
    await expect(
      within(canvasElement).queryByRole("button", { name: "Mistake queue" }),
    ).not.toBeInTheDocument();
  },
);

export const WithinNoiseInQualityTrend: StoryObj<typeof meta> = {
  args: noiseTallyProps(ALL_THREE),
  play: async ({ canvasElement }) => {
    await waitFor(
      async () => {
        await bestChoiceOfTwo(canvasElement);
      },
      { timeout: 8000 },
    );
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Quality trend" }),
    );
    const dialog = within(
      canvas.getByRole("region", { name: "Decision quality over time" }),
    );

    // The Best choice card and the one rolling batch's row agree.
    await expect(dialog.getAllByText("50.0%")).toHaveLength(2);
  },
};
