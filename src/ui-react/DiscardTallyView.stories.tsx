import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DiscardTallySummary } from "../ui/discardTally";
import { DiscardTallyView } from "./DiscardTallyView";
import { expect } from "storybook/test";

const meta = {
  component: DiscardTallyView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "DiscardTallyView",
} satisfies Meta<typeof DiscardTallyView>;

export default meta;

const summaryOf = (
  decisions: number,
  meanExpectedPointsLoss: number | null,
  optimalDecisions: number,
): DiscardTallySummary => ({
  decisions,
  meanExpectedPointsLoss,
  optimalDecisions,
  todayDecisions: 0,
  todayMeanExpectedPointsLoss: null,
  todayOptimalDecisions: 0,
});

const playedToday = (
  summary: DiscardTallySummary,
  decisions: number,
  mean: number,
): DiscardTallySummary => ({
  ...summary,
  todayDecisions: decisions,
  todayMeanExpectedPointsLoss: mean,
  todayOptimalDecisions: 2,
});

export const Default: StoryObj<typeof meta> = {
  args: { summary: playedToday(summaryOf(24, 0.7361, 9), 5, 0.4128) },
  /*
   * The figures are asserted one at a time because each sits in its own
   * element for styling, and this matcher will not join text across them the
   * way a browser-level one does.
   */
  play: async ({ canvas }) => {
    await expect(canvas.getByText("0.74")).toBeVisible();
    await expect(canvas.getByText("9")).toBeVisible();
    await expect(canvas.getByText("24")).toBeVisible();
    await expect(canvas.getByText("0.41")).toBeVisible();
  },
};

// A player who has always taken the top option still has an average, and it is zero rather than absent.
export const FaultlessSoFar: StoryObj<typeof meta> = {
  args: { summary: summaryOf(3, 0, 3) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("0.00")).toBeVisible();
  },
};

/*
 * Nothing is shown before a first discard is completed. A zero here would
 * read as faultless play rather than as an absence of evidence.
 */
export const NoDecisionsYet: StoryObj<typeof meta> = {
  args: { summary: summaryOf(0, null, 0) },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe("");
  },
};
