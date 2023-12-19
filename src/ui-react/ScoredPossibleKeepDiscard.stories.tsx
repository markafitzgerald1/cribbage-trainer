import { CARDS, Card } from "../game/Card";
import type { Meta, StoryObj } from "@storybook/react";
import { ComparableCard } from "../ui/sortCards";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { createArgTypes } from "./stories.common";
import { handPoints } from "../game/scoring";

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: ScoredPossibleKeepDiscard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "ScoredPossibleKeepDiscard",
} satisfies Meta<typeof ScoredPossibleKeepDiscard>;

export default meta;
type Story = StoryObj<typeof meta>;

const toComparableCard = (card: Card, index: number): ComparableCard => ({
  dealOrder: index,
  rank: card.rank,
});

const createStory = (
  keep: Card[],
  discard: Card[],
  sortOrder: SortOrder,
): Story => ({
  args: {
    discard: discard.map(toComparableCard),
    keep: keep.map(toComparableCard),
    points: handPoints(keep).total,
    sortOrder,
  },
});

export const JackSixFiveFourDiscardKingQueenSortedDescending: Story =
  createStory(
    [CARDS.JACK, CARDS.SIX, CARDS.FIVE, CARDS.FOUR],
    [CARDS.KING, CARDS.QUEEN],
    SortOrder.Descending,
  );
