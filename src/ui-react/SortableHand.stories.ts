import type { Meta, StoryObj } from "@storybook/react";
import { CARDS } from "../game/Card";
/* jscpd:ignore-start */
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { SortOrder } from "../ui/SortOrder";
import { SortableHand } from "./SortableHand";
import { createArgTypes } from "./stories.common";
/* jscpd:ignore-end */

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: SortableHand,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "SortableHand",
} satisfies Meta<typeof SortableHand>;

export default meta;
type Story = StoryObj<typeof meta>;

function createStory(sortOrder: SortOrder): Story {
  return {
    args: {
      dealtCards: Object.freeze([
        CARDS.JACK,
        CARDS.FIVE,
        CARDS.JACK,
        CARDS.ACE,
        CARDS.FOUR,
        CARDS.QUEEN,
      ]).map((card, index) => ({
        count: card.count,
        dealOrder: index,
        kept: true,
        rank: card.rank,
        rankLabel: card.rankLabel,
      })),
      sortOrder,
    },
  };
}

export const JackFiveJackAceFourQueenDealOrder = createStory(
  SortOrder.DealOrder,
);
export const JackFiveJackAceFourQueenDescending = createStory(
  SortOrder.Descending,
);
export const JackFiveJackAceFourQueenAscending = createStory(
  SortOrder.Ascending,
);
