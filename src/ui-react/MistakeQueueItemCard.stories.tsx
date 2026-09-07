/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  clickStoryButtonExpectingCall,
  expectStoryTextVisible,
} from "./stories.common";
import { MistakeQueueItemCard } from "./MistakeQueueItemCard";
import { SortOrder } from "../ui/SortOrder";
import { fn } from "storybook/test";
import { mockItemA } from "../ui/mistakeQueue.test.common";
/* jscpd:ignore-end */

const meta = {
  args: {
    item: mockItemA,
    onPractice: fn(),
    sortOrder: SortOrder.DealOrder,
  },
  component: MistakeQueueItemCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  title: "MistakeQueueItemCard",
} satisfies Meta<typeof MistakeQueueItemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  play: async ({ args, canvasElement }) => {
    await clickStoryButtonExpectingCall(
      canvasElement,
      "Practice this",
      args.onPractice,
    );
  },
};

export const Mastered: Story = {
  args: {
    item: {
      ...mockItemA,
      consecutiveSuccesses: 2,
      isMastered: true,
      lossQuantile: "high",
    },
  },
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(canvasElement, "Mastered");
  },
};

export const WithoutPreviousDiscard: Story = {
  args: {
    item: { ...mockItemA, lossQuantile: null, previousDiscard: null },
  },
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(canvasElement, "Previous choice not recorded");
  },
};
