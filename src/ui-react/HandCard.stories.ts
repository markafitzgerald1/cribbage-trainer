/* jscpd:ignore-start */
import { CARDS, RANK_NAMES, type Rank, Suit } from "../game/Card";
import { type Meta, type StoryObj, createArgTypes } from "./stories.common";
import { HandCard } from "./HandCard";
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

interface CreateStoryOptions {
  dealOrderIndex: number;
  kept: boolean;
  rank: Rank;
  suit: Suit;
}

const createStory = ({
  dealOrderIndex,
  kept,
  rank,
  suit,
}: CreateStoryOptions) => ({
  args: {
    dealOrderIndex,
    kept,
    onChange: () => null,
    rank,
    suit,
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

export const DiscardedFirstCardAceHearts: Story = createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.FIRST,
  kept: false,
  rank: CARDS.ACE.rank,
  suit: Suit.HEARTS,
});
export const KeptSecondCardFiveDiamonds: Story = createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.SECOND,
  kept: true,
  rank: CARDS.FIVE.rank,
  suit: Suit.DIAMONDS,
});
export const KeptThirdCardNineClubs: Story = createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.THIRD,
  kept: true,
  rank: CARDS.NINE.rank,
  suit: Suit.CLUBS,
});
export const KeptFourthCardTenSpades: Story = createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.FOURTH,
  kept: true,
  rank: CARDS.TEN.rank,
  suit: Suit.SPADES,
});
export const KeptFifthCardJackHearts: Story = createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.FIFTH,
  kept: true,
  rank: CARDS.JACK.rank,
  suit: Suit.HEARTS,
});
export const DiscardedSixthCardKingDiamonds: Story = createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.SIXTH,
  kept: false,
  rank: CARDS.KING.rank,
  suit: Suit.DIAMONDS,
});
