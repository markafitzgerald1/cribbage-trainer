/* jscpd:ignore-start */
import { CARDS, RANK_NAMES, Rank } from "../game/Card";
import type { Meta, StoryObj } from "@storybook/react";
/* jscpd:ignore-end */
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

const createStory = (dealOrderIndex: number, kept: boolean, rank: Rank) => ({
  args: {
    dealOrderIndex,
    kept,
    onChange: () => null,
    rank,
  },
});

const DEAL_ORDER_INDEX = {
  FIFTH: 4,
  FIRST: 0,
  FOURTH: 3,
  SECOND: 1,
  SIXTH: 5,
  THIRD: 2,
};

export const DiscardedFirstCardAce: Story = createStory(
  DEAL_ORDER_INDEX.FIRST,
  false,
  CARDS.ACE.rank,
);
export const KeptSecondCardFive: Story = createStory(
  DEAL_ORDER_INDEX.SECOND,
  true,
  CARDS.FIVE.rank,
);
export const KeptThirdCardNine: Story = createStory(
  DEAL_ORDER_INDEX.THIRD,
  true,
  CARDS.NINE.rank,
);
export const KeptFourthCardTen: Story = createStory(
  DEAL_ORDER_INDEX.FOURTH,
  true,
  CARDS.TEN.rank,
);
export const KeptFifthCardJack: Story = createStory(
  DEAL_ORDER_INDEX.FIFTH,
  true,
  CARDS.JACK.rank,
);
export const DiscardedFifthCardKing: Story = createStory(
  DEAL_ORDER_INDEX.SIXTH,
  false,
  CARDS.KING.rank,
);
