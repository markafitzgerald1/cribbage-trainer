import { CARDS, type Card } from "../game/Card";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComparableCard } from "../ui/sortCards";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { createArgTypes } from "./stories.common";
import { createElement } from "react";
import { expectedHandPoints } from "../game/expectedHandPoints";
import { handPoints } from "../game/handPoints";

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: ScoredPossibleKeepDiscard,
  decorators: [
    (Story) =>
      createElement(
        "table",
        null,
        createElement("tbody", null, createElement(Story, null)),
      ),
  ],
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

interface CreateStoryOptions {
  readonly keep: Card[];
  readonly discard: Card[];
  readonly sortOrder: SortOrder;
  readonly isHighlighted?: boolean;
}

const createStory = ({
  keep,
  discard,
  sortOrder,
  isHighlighted = false,
}: CreateStoryOptions): Story => ({
  args: {
    discard: discard.map(toComparableCard),
    expectedHandPoints: expectedHandPoints(keep, discard).total,
    handPoints: handPoints(keep).total,
    isHighlighted,
    keep: keep.map(toComparableCard),
    sortOrder,
  },
});

export const JackSixFiveFourDiscardKingQueenSortedDescending: Story =
  createStory({
    discard: [CARDS.KING, CARDS.QUEEN],
    keep: [CARDS.JACK, CARDS.SIX, CARDS.FIVE, CARDS.FOUR],
    sortOrder: SortOrder.Descending,
  });

/* jscpd:ignore-start */
export const JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted: Story =
  createStory({
    discard: [CARDS.KING, CARDS.QUEEN],
    isHighlighted: true,
    keep: [CARDS.JACK, CARDS.SIX, CARDS.FIVE, CARDS.FOUR],
    sortOrder: SortOrder.Descending,
  });
/* jscpd:ignore-end */

export const TwoTenNineJackDiscardKingFourSortedAscending: Story = createStory({
  discard: [CARDS.KING, CARDS.FOUR],
  keep: [CARDS.TWO, CARDS.TEN, CARDS.NINE, CARDS.JACK],
  sortOrder: SortOrder.Ascending,
});

export const FiveFiveAceJackDiscardFourSevenSortedInDealOrder: Story =
  createStory({
    discard: [CARDS.FOUR, CARDS.SEVEN],
    keep: [CARDS.FIVE, CARDS.FIVE, CARDS.ACE, CARDS.JACK],
    sortOrder: SortOrder.DealOrder,
  });
