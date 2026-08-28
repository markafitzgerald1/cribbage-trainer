/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { basePanelArgs, sampleVerdict } from "./PracticeDrillPanel.test.common";
import {
  clickStoryButtonExpectingCall,
  expectStoryTextVisible,
} from "./stories.common";
import { PracticeDrillPanel } from "./PracticeDrillPanel";
import { fn } from "storybook/test";
/* jscpd:ignore-end */

const meta = {
  args: { ...basePanelArgs(), onCommit: fn(), onExit: fn(), onNextHand: fn() },
  component: PracticeDrillPanel,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  title: "PracticeDrillPanel",
} satisfies Meta<typeof PracticeDrillPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Choosing: Story = {
  play: async ({ args, canvasElement }) => {
    await clickStoryButtonExpectingCall(
      canvasElement,
      "Check discard",
      args.onCommit,
    );
  },
};

export const AwaitingAnswer: Story = {
  args: { phase: "revealed" },
};

export const OptimalVerdict: Story = {
  args: { phase: "revealed", verdict: sampleVerdict() },
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(canvasElement, /toward mastery/u);
  },
};

export const MissVerdict: Story = {
  args: {
    hasNextHand: false,
    phase: "revealed",
    verdict: sampleVerdict({
      chosenDiscard: "10H,10S",
      chosenLoss: 0.63,
      consecutiveSuccesses: 0,
      isOptimal: false,
      previousDiscard: null,
      previousLoss: 0.63,
    }),
  },
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(canvasElement, /against the best discard/u);
  },
};
