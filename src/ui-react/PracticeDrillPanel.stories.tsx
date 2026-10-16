/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  basePanelArgs,
  changedTablesNote,
  changedVerdict,
  currentVerdict,
  failedVerdict,
  retryIdentity,
  revealedPanelArgs,
  sampleVerdict,
  unknownTablesNote,
} from "./PracticeDrillPanel.test.common";
import {
  clickStoryButtonExpectingCall,
  expectStoryTextVisible,
} from "./stories.common";
import { expect, fn, within } from "storybook/test";
import { PracticeDrillPanel } from "./PracticeDrillPanel";
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
    const first = canvasElement.querySelector("section > div > :first-child");

    await expect(first).toHaveTextContent(/^PracticeCheck discardExit drill$/u);

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
    const badge = within(canvasElement).getByText("Practice");

    await expect(badge.parentElement?.nextElementSibling).toHaveTextContent(
      /toward mastery/u,
    );

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
    await expectStoryTextVisible(
      canvasElement,
      /points behind the best choice with current tables/u,
    );
  },
};

export const ReviewWithEarlierDiscardLocate: Story = {
  args: {
    onLocateEarlierChoice: fn(),
    phase: "revealed",
    verdict: sampleVerdict({
      chosenDiscard: "5H,6H",
      chosenLoss: 0,
      consecutiveSuccesses: 1,
      isOptimal: true,
      previousDiscard: "7C,8C",
      previousLoss: 1.42,
    }),
  },
  play: async ({ args, canvasElement }) => {
    await clickStoryButtonExpectingCall(
      canvasElement,
      "Scroll to previous mistake in table",
      args.onLocateEarlierChoice,
    );
  },
};

export const ReviewWithRepeatedMistake: Story = {
  args: {
    phase: "revealed",
    verdict: sampleVerdict({
      chosenDiscard: "7C,8C",
      chosenLoss: 1.42,
      consecutiveSuccesses: 0,
      isOptimal: false,
      previousDiscard: "7C,8C",
      previousLoss: 1.42,
    }),
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", {
        name: "Scroll to previous mistake in table",
      }),
    ).toBeInTheDocument();

    await expectStoryTextVisible(
      canvasElement,
      /1\.42 points behind the best choice with current tables/u,
    );
  },
};

export const ChangedTables: Story = {
  args: revealedPanelArgs(changedVerdict()),
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(canvasElement, changedTablesNote);
  },
};

export const CurrentTables: Story = {
  args: revealedPanelArgs(currentVerdict()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText(changedTablesNote)).toBeNull();
    await expect(canvas.getByText("Retry — current tables")).toBeVisible();
  },
};

export const UnknownOriginalTables: Story = {
  args: revealedPanelArgs(sampleVerdict({ retryTableIdentity: retryIdentity })),
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(canvasElement, unknownTablesNote);
  },
};

export const MasteredUnderChangedTables: Story = {
  args: {
    hasNextHand: false,
    phase: "revealed",
    verdict: sampleVerdict({
      ...changedVerdict(),
      consecutiveSuccesses: 2,
      isMastered: true,
    }),
  },
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(canvasElement, "Mastered.");
  },
};

export const SubCentRetry: Story = {
  args: revealedPanelArgs(failedVerdict(0.004)),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("note", {
        name: "less than 0.01 points behind the best choice with current tables.",
      }),
    ).toBeVisible();
  },
};
