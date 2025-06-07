/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createArgTypes, toDealtCards } from "./stories.common";
import { CARDS } from "../game/Card";
import type { DealtCard } from "../game/DealtCard";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
/* jscpd:ignore-end */

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: ScoredPossibleKeepDiscards,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "ScoredPossibleKeepDiscards",
} satisfies Meta<typeof ScoredPossibleKeepDiscards>;

export default meta;
type Story = StoryObj<typeof meta>;

const createStory = (dealtCards: DealtCard[], sortOrder: SortOrder): Story => ({
  args: {
    dealtCards,
    sortOrder,
  },
});

const dealtCards = toDealtCards(
  [CARDS.JACK, CARDS.SIX, CARDS.FIVE, CARDS.FOUR, CARDS.KING, CARDS.QUEEN],
  [0, 1],
);

export const JackSixFiveFourKingQueenSortedDescending: Story = createStory(
  dealtCards,
  SortOrder.Descending,
);
export const JackSixFiveFourKingQueenSortedAscending: Story = createStory(
  dealtCards,
  SortOrder.Ascending,
);
export const JackSixFiveFourKingQueenSortedDealOrder: Story = createStory(
  dealtCards,
  SortOrder.DealOrder,
);
