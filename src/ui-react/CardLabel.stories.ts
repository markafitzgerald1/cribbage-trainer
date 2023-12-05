import type { Meta, StoryObj } from "@storybook/react";
import { CARDS } from "../game/Card";
import { CardLabel } from "./CardLabel";

const meta = {
  component: CardLabel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "CardLabel",
} satisfies Meta<typeof CardLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ace: Story = {
  args: {
    rank: CARDS.ACE.rank,
  },
};

export const Five: Story = {
  args: {
    rank: CARDS.FIVE.rank,
  },
};

export const Nine: Story = {
  args: {
    rank: CARDS.NINE.rank,
  },
};

export const Ten: Story = {
  args: {
    rank: CARDS.TEN.rank,
  },
};

export const Jack: Story = {
  args: {
    rank: CARDS.JACK.rank,
  },
};

export const King: Story = {
  args: {
    rank: CARDS.KING.rank,
  },
};
