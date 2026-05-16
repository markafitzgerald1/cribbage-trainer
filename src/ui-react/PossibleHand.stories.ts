/* jscpd:ignore-start */
import { CARDS, type Card } from "../game/Card";
import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  type StoryObj,
  createArgTypes,
} from "./stories.common";
/* jscpd:ignore-end */
import { PossibleHand } from "./PossibleHand";

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
      suit: card.suit,
    })),
    sortOrder,
  },
});

export const AceEightFourThreeHandSortedDescending: Story = createStory(
  [CARDS.ACE, CARDS.EIGHT, CARDS.FOUR, CARDS.THREE],
  SortOrder.Descending,
);

export const TwoThreeTenTenHandSortedInDealOrder: Story = createStory(
  [CARDS.TWO, CARDS.THREE, CARDS.TEN, CARDS.TEN],
  SortOrder.DealOrder,
);

export const KingJackFiveSixHandSortedAscending: Story = createStory(
  [CARDS.KING, CARDS.JACK, CARDS.FIVE, CARDS.SIX],
  SortOrder.Ascending,
);

export const EightSevenDiscardSortedInDealOrder: Story = createStory(
  [CARDS.EIGHT, CARDS.SEVEN],
  SortOrder.DealOrder,
);

export const SixQueenDiscardSortedDescending: Story = createStory(
  [CARDS.SIX, CARDS.QUEEN],
  SortOrder.Descending,
);

export const AceAceDiscardSortedAscending: Story = createStory(
  [CARDS.ACE, CARDS.ACE],
  SortOrder.Ascending,
);
