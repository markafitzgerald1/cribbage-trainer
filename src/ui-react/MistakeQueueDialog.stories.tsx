/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  expectStoryTextVisible,
  playStoryEscape,
  selectStoryRadioOption,
} from "./stories.common";
import { MistakeQueueDialog } from "./MistakeQueueDialog";
import dialogFixtures from "./MistakeQueueDialog.test.common";
import { fn } from "storybook/test";
/* jscpd:ignore-end */

const sampleTally = dialogFixtures.createSampleMistakeTally();
const allMasteredTally = dialogFixtures.createAllMasteredTally();
const emptyMistakeTally = dialogFixtures.createEmptyMistakeTally();

const meta: Meta<typeof MistakeQueueDialog> = {
  args: {
    initialQuantileFilter: "all",
    initialRoleFilter: "all",
    initialSortOrder: "priority",
    initialStatusFilter: "active",
    onClose: fn(),
    show: true,
    tally: sampleTally,
  },
  component: MistakeQueueDialog,
  tags: ["autodocs"],
  title: "MistakeQueueDialog",
};

export default meta;
type QueueStory = StoryObj<typeof meta>;

export const DefaultOpen: QueueStory = {
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(canvasElement, "Mistake queue");
    await selectStoryRadioOption(canvasElement, "Highest loss");
    await selectStoryRadioOption(canvasElement, "Priority");
  },
};

export const FilterByRole: QueueStory = {
  play: async ({ canvasElement }) => {
    await selectStoryRadioOption(canvasElement, "Dealer");
  },
};

export const FilterByStatus: QueueStory = {
  play: async ({ canvasElement }) => {
    await selectStoryRadioOption(canvasElement, "Mastered");
  },
};

export const FilterByQuantile: QueueStory = {
  args: {
    initialStatusFilter: "all",
  },
  play: async ({ canvasElement }) => {
    await selectStoryRadioOption(canvasElement, /^High severity/u);
  },
};

export const AllMasteredEmptyState: QueueStory = {
  args: {
    tally: allMasteredTally,
  },
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(canvasElement, "All mistake hands mastered!");
  },
};

export const EmptyQueueNotice: QueueStory = {
  args: {
    tally: emptyMistakeTally,
  },
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(
      canvasElement,
      /No mistake hands recorded yet/iu,
    );
  },
};

export const DismissWithEscape: QueueStory = {
  play: playStoryEscape,
};
