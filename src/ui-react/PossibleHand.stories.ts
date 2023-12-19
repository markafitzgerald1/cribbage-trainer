import { CARDS, Card } from "../game/Card";
import type { Meta, StoryObj } from "@storybook/react";
import { PossibleHand } from "./PossibleHand";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { SortOrder } from "../ui/SortOrder";
import { createArgTypes } from "./stories.common";

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: PossibleHand,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "PossibleHand",
} satisfies Meta<typeof PossibleHand>;

export default meta;
type Story = StoryObj<typeof meta>;

const createStory = (dealtCards: Card[], sortOrder: SortOrder): Story => ({
  args: {
    dealtCards: dealtCards.map((card, index) => ({
      dealOrder: index,
      rank: card.rank,
    })),
    sortOrder,
  },
});

export const AceEightFourThreeDescending: Story = createStory(
  [CARDS.ACE, CARDS.EIGHT, CARDS.FOUR, CARDS.THREE],
  SortOrder.Descending,
);

export const TwoThreeTenTenDealOrder: Story = createStory(
  [CARDS.TWO, CARDS.THREE, CARDS.TEN, CARDS.TEN],
  SortOrder.DealOrder,
);

export const KingJackFiveSixAscending: Story = createStory(
  [CARDS.KING, CARDS.JACK, CARDS.FIVE, CARDS.SIX],
  SortOrder.Ascending,
);
