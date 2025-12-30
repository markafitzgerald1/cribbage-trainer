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

const createStory = (
  keep: Card[],
  discard: Card[],
  sortOrder: SortOrder,
): Story => ({
  args: {
    discard: discard.map(toComparableCard),
    expectedHandPoints: expectedHandPoints(keep, discard).total,
    handPoints: handPoints(keep).total,
    keep: keep.map(toComparableCard),
    sortOrder,
  },
});

export const JackSixFiveFourDiscardKingQueenSortedDescending: Story =
  createStory(
    [CARDS.JACK, CARDS.SIX, CARDS.FIVE, CARDS.FOUR],
    [CARDS.KING, CARDS.QUEEN],
    SortOrder.Descending,
  );

export const TwoTenNineJackDiscardKingFourSortedAscending: Story = createStory(
  [CARDS.TWO, CARDS.TEN, CARDS.NINE, CARDS.JACK],
  [CARDS.KING, CARDS.FOUR],
  SortOrder.Ascending,
);

export const FiveFiveAceJackDiscardFourSevenSortedInDealOrder: Story =
  createStory(
    [CARDS.FIVE, CARDS.FIVE, CARDS.ACE, CARDS.JACK],
    [CARDS.FOUR, CARDS.SEVEN],
    SortOrder.DealOrder,
  );
