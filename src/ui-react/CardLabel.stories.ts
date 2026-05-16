/* jscpd:ignore-start */
import { CARDS, RANK_NAMES, type Rank, Suit } from "../game/Card";
import { type Meta, type StoryObj, createArgTypes } from "./stories.common";
import { CardLabel } from "./CardLabel";
/* jscpd:ignore-end */

const meta = {
  argTypes: createArgTypes("rank", RANK_NAMES),
  component: CardLabel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "CardLabel",
} satisfies Meta<typeof CardLabel>;

export default meta;
type Story = StoryObj<typeof meta>;
const createStory = (rank: number): Story => ({
  args: { rank: rank as Rank },
});

export const Ace = createStory(CARDS.ACE.rank);
export const Five = createStory(CARDS.FIVE.rank);
export const Nine = createStory(CARDS.NINE.rank);
export const Ten = createStory(CARDS.TEN.rank);
export const Jack = createStory(CARDS.JACK.rank);
export const King = createStory(CARDS.KING.rank);

export const AceOfHearts: Story = {
  args: {
    rank: CARDS.ACE.rank,
    suit: Suit.HEARTS,
  },
};

export const FiveOfDiamonds: Story = {
  args: {
    rank: CARDS.FIVE.rank,
    suit: Suit.DIAMONDS,
  },
};

export const GroupedSuits: Story = {
  args: {
    rank: CARDS.FIVE.rank,
    suits: [Suit.HEARTS, Suit.DIAMONDS],
  },
};

export const GroupedRanksAndSuits: Story = {
  args: {
    ranks: [CARDS.TEN.rank, CARDS.JACK.rank, CARDS.QUEEN.rank, CARDS.KING.rank],
    suits: [Suit.CLUBS, Suit.SPADES],
  },
};
