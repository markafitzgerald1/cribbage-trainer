import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DiscardTallySummary } from "../ui/discardTally";
import { DiscardTallyView } from "./DiscardTallyView";
import { discardTallySummary } from "./discardTally.test.common";
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
 * Nothing is shown before a first discard is completed. A zero would read as
 * faultless play rather than as an absence of evidence.
 */
export const NoDecisionsYet: StoryObj<typeof meta> = {
  args: { summary: discardTallySummary({ meanExpectedPointsLoss: null }) },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe("");
  },
};
