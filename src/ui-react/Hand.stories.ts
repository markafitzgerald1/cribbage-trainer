import { CARDS, Rank } from "../game/Card";
import type { Meta, StoryObj } from "@storybook/react";
import { Hand } from "./Hand";
/* jscpd:ignore-start */
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { SortOrder } from "../ui/SortOrder";
import { createArgTypes } from "./stories.common";
/* jscpd:ignore-end */

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: Hand,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Hand",
} satisfies Meta<typeof Hand>;

export default meta;
type Story = StoryObj<typeof meta>;

const AceSevenQueenFourSevenFive = Object.freeze([
  CARDS.ACE,
  CARDS.SEVEN,
  CARDS.QUEEN,
  CARDS.FOUR,
  CARDS.SEVEN,
  CARDS.FIVE,
]);

const createStory = (
  predicate: (rank: Rank) => boolean,
  sortOrder: SortOrder,
) => ({
  args: {
    dealtCards: AceSevenQueenFourSevenFive.map((card, index) => ({
      dealOrder: index,
      kept: predicate(card.rank),
      rank: card.rank,
    })),
    sortOrder,
  },
});

export const AceSevenQueenFourSevenFiveDescendingDiscardQueenFour: Story =
  createStory(
    (rank) => rank !== Rank.QUEEN && rank !== Rank.FOUR,
    SortOrder.Descending,
  );

export const AceSevenQueenFourSevenFiveAscendingDiscardSevenSeven: Story =
  createStory((rank) => rank !== Rank.SEVEN, SortOrder.Ascending);

export const AceSevenQueenFourSevenFiveDealOrderDiscardQueenFive: Story =
  createStory(
    (rank) => rank !== Rank.QUEEN && rank !== Rank.FIVE,
    SortOrder.DealOrder,
  );
