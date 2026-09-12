import "./vars.css";
import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  type StoryObj,
  createArgTypes,
  expectStoryTextVisible,
  toDealtCards,
} from "./stories.common";
import { Rank, Suit, createCard } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import type { CutOutcomeOption } from "./cutOutcome";
import { CutOutcomePanel } from "./CutOutcomePanel";

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: CutOutcomePanel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "CutOutcomePanel",
} satisfies Meta<typeof CutOutcomePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const HAND = [
  createCard(Rank.KING, Suit.HEARTS),
  createCard(Rank.QUEEN, Suit.SPADES),
  createCard(Rank.TEN, Suit.DIAMONDS),
  createCard(Rank.NINE, Suit.CLUBS),
  createCard(Rank.SIX, Suit.SPADES),
  createCard(Rank.FIVE, Suit.HEARTS),
] as const;

const INDEX_OF_KING = 0;
const INDEX_OF_NINE = 3;
const INDEX_OF_SIX = 4;
const INDEX_OF_FIVE = 5;

const THROW_SIX_FIVE = [INDEX_OF_SIX, INDEX_OF_FIVE];
const THROW_KING_NINE = [INDEX_OF_KING, INDEX_OF_NINE];

// The board the user is looking at: six and five are out, the rest are kept.
const BOARD = toDealtCards([...HAND], THROW_SIX_FIVE);

const optionFrom = (
  discardIndices: readonly number[],
  expectedHandPoints: number,
  signedExpectedCribPoints: number,
): CutOutcomeOption => ({
  discard: BOARD.filter((_, index) => discardIndices.includes(index)),
  expectedHandPoints,
  keep: BOARD.filter((_, index) => !discardIndices.includes(index)),
  signedExpectedCribPoints,
});

const CHOSEN = optionFrom(THROW_SIX_FIVE, 7.65, 4.12);
const BEST = optionFrom(THROW_KING_NINE, 8.41, 3.98);
const BOTH_ROWS = [BEST, CHOSEN];

/*
 * The crib expectation reaches this panel already signed by role, so a pone's
 * is negative. Reusing the dealer's fixtures would show a pone gaining from a
 * crib its own count column subtracts — a state the analysis cannot produce.
 */
const PONE_ROWS = [
  optionFrom(THROW_KING_NINE, 8.41, -3.98),
  optionFrom(THROW_SIX_FIVE, 7.65, -4.12),
];

interface CreateStoryOptions {
  readonly cribRole: CribRole;
  readonly options: readonly CutOutcomeOption[];
  readonly sortOrder: SortOrder;
}

const createStory = ({
  cribRole,
  options,
  sortOrder,
}: CreateStoryOptions): Story => ({
  args: {
    cribRole,
    dealtCards: BOARD,
    scoredKeepDiscardsByNetScore: options,
    sortOrder,
  },
});

export const Dealer: Story = createStory({
  cribRole: CribRole.Dealer,
  options: BOTH_ROWS,
  sortOrder: SortOrder.Descending,
});

export const Pone: Story = createStory({
  cribRole: CribRole.Pone,
  options: PONE_ROWS,
  sortOrder: SortOrder.Descending,
});

export const AscendingSort: Story = createStory({
  cribRole: CribRole.Dealer,
  options: BOTH_ROWS,
  sortOrder: SortOrder.Ascending,
});

// The user already played the discard the app ranks first, so there is nothing to compare against.
export const PlayedTheTopChoice: Story = createStory({
  cribRole: CribRole.Dealer,
  options: [CHOSEN],
  sortOrder: SortOrder.Descending,
});

Dealer.play = async ({ canvasElement }) => {
  await expectStoryTextVisible(canvasElement, "one sample, not a verdict");
  await expectStoryTextVisible(canvasElement, "Top choice");
};

PlayedTheTopChoice.play = async ({ canvasElement }) => {
  await expectStoryTextVisible(canvasElement, "Yours, the top choice");
};
