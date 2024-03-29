import { CARDS, RANK_NAMES } from "../game/Card";
import type { Meta, StoryObj } from "@storybook/react";
import { HandCard } from "./HandCard";
/* jscpd:ignore-start */
import { createArgTypes } from "./stories.common";
/* jscpd:ignore-end */

const meta = {
  argTypes: createArgTypes("rank", RANK_NAMES),
  component: HandCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "HandCard",
} satisfies Meta<typeof HandCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DiscardedFirstCardAce: Story = {
  args: {
    dealOrderIndex: 0,
    kept: false,
    rank: CARDS.ACE.rank,
  },
};

export const KeptSecondCardFive: Story = {
  args: {
    dealOrderIndex: 1,
    kept: true,
    rank: CARDS.FIVE.rank,
  },
};

export const KeptThirdCardNine: Story = {
  args: {
    dealOrderIndex: 2,
    kept: true,
    rank: CARDS.NINE.rank,
  },
};

export const KeptFourthCardTen: Story = {
  args: {
    dealOrderIndex: 3,
    kept: true,
    rank: CARDS.TEN.rank,
  },
};

export const KeptFifthCardJack: Story = {
  args: {
    dealOrderIndex: 4,
    kept: true,
    rank: CARDS.JACK.rank,
  },
};

export const DiscardedFifthCardKing: Story = {
  args: {
    dealOrderIndex: 5,
    kept: false,
    rank: CARDS.KING.rank,
  },
};
