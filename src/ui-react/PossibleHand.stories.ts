import type { Meta, StoryObj } from "@storybook/react";

import { CARDS } from "../game/Card";
import { PossibleHand } from "./PossibleHand";
import { SortOrder } from "../ui/SortOrder";

const meta = {
  component: PossibleHand,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "PossibleHand",
} satisfies Meta<typeof PossibleHand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCard: Story = {
  args: {
    dealtCards: [CARDS.ACE, CARDS.EIGHT, CARDS.FOUR, CARDS.THREE].map(
      (card, dealOrder) => ({
        dealOrder,
        rank: card.rank,
      }),
    ),
    sortOrder: SortOrder.DealOrder,
  },
};
