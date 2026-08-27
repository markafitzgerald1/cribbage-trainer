/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SortOrder } from "../ui/SortOrder";
import { SortedCardLabels } from "./SortedCardLabels";
import { expect } from "storybook/test";
import { parseHand } from "../game/Card";
/* jscpd:ignore-end */

const sampleCards = parseHand("5H,KS,AC,7D,9C,2S");

const meta = {
  component: SortedCardLabels,
  parameters: {
    docs: {
      description: {
        component: "Renders card labels sorted by rank or deal order.",
      },
    },
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "SortedCardLabels",
} satisfies Meta<typeof SortedCardLabels>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Descending: Story = {
  args: {
    cards: sampleCards,
    sortOrder: SortOrder.Descending,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent("K♠9♣7♦5♥2♠A♣");
  },
};

export const Ascending: Story = {
  args: {
    cards: sampleCards,
    sortOrder: SortOrder.Ascending,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent("A♣2♠5♥7♦9♣K♠");
  },
};

export const DealOrder: Story = {
  args: {
    cards: sampleCards,
    sortOrder: SortOrder.DealOrder,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent("5♥K♠A♣7♦9♣2♠");
  },
};
