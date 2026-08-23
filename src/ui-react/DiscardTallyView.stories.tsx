import type { Meta, StoryObj } from "@storybook/react-vite";
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
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    summary: {
      decisions: 24,
      meanExpectedPointsLoss: 0.7361,
      optimalDecisions: 9,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("0.74")).toBeVisible();
  },
};

// A player who has always taken the top option still has an average, and it is zero rather than absent.
export const FaultlessSoFar: Story = {
  args: {
    summary: {
      decisions: 3,
      meanExpectedPointsLoss: 0,
      optimalDecisions: 3,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("0.00")).toBeVisible();
  },
};

/*
 * Nothing is shown before a first discard is completed. A zero here would
 * read as faultless play rather than as an absence of evidence.
 */
export const NoDecisionsYet: Story = {
  args: {
    summary: {
      decisions: 0,
      meanExpectedPointsLoss: null,
      optimalDecisions: 0,
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe("");
  },
};
