import type { Meta, StoryObj } from "@storybook/react";

import { CARDS } from "../game/Card";
import { Card } from "../ui-react/Card";

const meta = {
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Card",
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DiscardedFirstCardAce: Story = {
  args: {
    dealOrderIndex: 0,
    kept: false,
    rankLabel: CARDS.ACE.rankLabel,
  },
};

export const KeptSecondCardFive: Story = {
  args: {
    dealOrderIndex: 1,
    kept: true,
    rankLabel: CARDS.FIVE.rankLabel,
  },
};

export const KeptThirdCardNine: Story = {
  args: {
    dealOrderIndex: 2,
    kept: true,
    rankLabel: CARDS.NINE.rankLabel,
  },
};

export const KeptFourthCardTen: Story = {
  args: {
    dealOrderIndex: 3,
    kept: true,
    rankLabel: CARDS.TEN.rankLabel,
  },
};

export const KeptFifthCardJack: Story = {
  args: {
    dealOrderIndex: 4,
    kept: true,
    rankLabel: CARDS.JACK.rankLabel,
  },
};

export const DiscardedFifthCardKing: Story = {
  args: {
    dealOrderIndex: 5,
    kept: false,
    rankLabel: CARDS.KING.rankLabel,
  },
};
