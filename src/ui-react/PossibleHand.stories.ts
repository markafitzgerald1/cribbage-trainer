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
    dealtCards: [
      {
        count: CARDS.ACE.count,
        dealOrder: 0,
        kept: false,
        rank: CARDS.ACE.rank,
        rankLabel: CARDS.ACE.rankLabel,
      },
      {
        count: CARDS.EIGHT.count,
        dealOrder: 1,
        kept: true,
        rank: CARDS.EIGHT.rank,
        rankLabel: CARDS.EIGHT.rankLabel,
      },
      {
        count: CARDS.FOUR.count,
        dealOrder: 2,
        kept: true,
        rank: CARDS.FOUR.rank,
        rankLabel: CARDS.FOUR.rankLabel,
      },
      {
        count: CARDS.THREE.count,
        dealOrder: 3,
        kept: false,
        rank: CARDS.THREE.rank,
        rankLabel: CARDS.THREE.rankLabel,
      },
    ],
    sortOrder: SortOrder.DealOrder,
  },
};
