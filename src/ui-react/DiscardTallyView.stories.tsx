/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import type { DiscardTallySummary } from "../ui/discardTally";
import { DiscardTallyView } from "./DiscardTallyView";
import { createSampleMistakeTally } from "./MistakeQueueDialog.test.common";
import { discardTallySummary } from "./discardTally.test.common";

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

export const OpenQualityTrend: StoryObj<typeof meta> = {
  args: {
    summary: discardTallySummary({
      decisions: 10,
      meanExpectedPointsLoss: 0.25,
      optimalDecisions: 7,
    }),
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
    summary: discardTallySummary({
      decisions: 10,
      meanExpectedPointsLoss: 0.25,
      optimalDecisions: 7,
    }),
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
/* jscpd:ignore-end */
