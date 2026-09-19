/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  clickStoryButtonExpectingCall,
  expectStoryTextVisible,
} from "./stories.common";
import { expect, fn, within } from "storybook/test";
import {
  mockItemA,
  mockItemWithRoleLossPair,
  mockTradeOffClassification,
} from "../ui/mistakeQueue.test.common";
import { MistakeQueueItemCard } from "./MistakeQueueItemCard";
import { SortOrder } from "../ui/SortOrder";
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

export const WithLossReason: Story = {
  args: {
    lossReason: "Crib",
  },
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(canvasElement, "Prev: Crib");
  },
};

// Both badges are asserted together because the #824 role-cost pair sits beside the component decomposition rather than replacing it.
export const WithRoleLossPair: Story = {
  args: {
    classification: mockTradeOffClassification,
    item: mockItemWithRoleLossPair,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pair = canvas.getByRole("note", {
      name: "Previous discard cost 1.00 points lost as dealer, 0.00 as pone",
    });

    await expect(pair).toBeVisible();
    await expect(pair).toHaveTextContent("1.00 as dealer, 0.00 as pone");
    await expect(canvas.getByText("Prev: Crib gain < Hand loss")).toBeVisible();
  },
};

export const WithClassification: Story = {
  args: {
    classification: mockTradeOffClassification,
  },
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByRole("note", {
      name: "Previous discard driven by 1.30 Crib gain does not cover 1.40 Hand loss",
    });

    await expect(badge).toBeVisible();
    await expect(badge).toHaveTextContent("Prev: Crib gain < Hand loss");
    await expect(badge).toHaveAttribute(
      "title",
      "Previous discard (0.10 pts lost) driven by 1.30 Crib gain does not cover 1.40 Hand loss",
    );
  },
};
