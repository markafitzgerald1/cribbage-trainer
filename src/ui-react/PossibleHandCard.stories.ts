/* jscpd:ignore-start */
import { CARDS, RANK_NAMES, type Rank, Suit } from "../game/Card";
import { type Meta, type StoryObj, createArgTypes } from "./stories.common";
import { PossibleHandCard } from "./PossibleHandCard";
/* jscpd:ignore-end */

const meta = {
  argTypes: createArgTypes("rank", RANK_NAMES),
  component: PossibleHandCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "PossibleHandCard",
} satisfies Meta<typeof PossibleHandCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const createStory = (rank: Rank, suit: Suit): Story => ({
  args: { rank, suit },
});

export const TwoOfClubs = createStory(CARDS.TWO.rank, Suit.CLUBS);
export const ThreeOfDiamonds = createStory(CARDS.THREE.rank, Suit.DIAMONDS);
export const SevenOfHearts = createStory(CARDS.SEVEN.rank, Suit.HEARTS);
export const JackOfSpades = createStory(CARDS.JACK.rank, Suit.SPADES);
export const QueenOfHearts = createStory(CARDS.QUEEN.rank, Suit.HEARTS);
export const KingOfClubs = createStory(CARDS.KING.rank, Suit.CLUBS);
