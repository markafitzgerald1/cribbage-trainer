/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createArgTypes, toDealtCards } from "./stories.common";
import { CARDS } from "../game/Card";
import { InteractiveHand } from "./InteractiveHand";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { SortOrder } from "../ui/SortOrder";
/* jscpd:ignore-end */

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: InteractiveHand,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "InteractiveHand",
} satisfies Meta<typeof InteractiveHand>;

export default meta;
type Story = StoryObj<typeof meta>;

function createStory(sortOrder: SortOrder): Story {
  return {
    args: {
      dealtCards: toDealtCards([
        CARDS.JACK,
        CARDS.FIVE,
        CARDS.JACK,
        CARDS.ACE,
        CARDS.FOUR,
        CARDS.QUEEN,
      ]),
      onCardChange: () => null,
      onDeal: () => null,
      onSortOrderChange: () => null,
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
