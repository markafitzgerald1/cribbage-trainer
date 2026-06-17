/* jscpd:ignore-start */
import { CARDS, type Card } from "../game/Card";
import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  type StoryObj,
  createArgTypes,
  playToggle,
} from "./stories.common";
/* jscpd:ignore-end */
import {
  expectedCutAddedPoints,
  toCutBreakdown,
} from "../game/expectedCutAddedPoints";
import type { ComparableCard } from "../ui/sortCards";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
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
  suit: card.suit,
});

const cribStarterPoints = [
  {
    expectedCribPoints: 1.25,
    remainingStarterCount: 4,
    signedExpectedCribPoints: 1.25,
    starterRank: "K",
  },
] as const;

interface CreateStoryOptions {
  readonly discard: readonly Card[];
  readonly isHighlighted?: boolean;
  readonly keep: readonly Card[];
  readonly sortOrder: SortOrder;
}

const createStory = ({
  keep,
  discard,
  sortOrder,
  isHighlighted = false,
}: CreateStoryOptions): Story => {
  const cutAdded = expectedCutAddedPoints(keep, discard);
  const handExpectedPoints = expectedHandPoints(keep, discard).total;
  const points = handPoints(keep);
  return {
    args: {
      ...toCutBreakdown(cutAdded),
      cribStarterPoints,
      discard: discard.map(toComparableCard),
      expectedHandPoints: handExpectedPoints,
      expectedNetPoints: handExpectedPoints + 1.25,
      handPointsBreakdown: points,
      isHighlighted,
      keep: keep.map(toComparableCard),
      rowIndex: 0,
      signedExpectedCribPoints: 1.25,
      sortOrder,
    },
  };
};

const jackSixFiveFourKeepKingQueenDiscard = {
  discard: [CARDS.KING, CARDS.QUEEN],
  keep: [CARDS.JACK, CARDS.SIX, CARDS.FIVE, CARDS.FOUR],
} as const;

export const JackSixFiveFourDiscardKingQueenSortedDescending: Story =
  createStory({
    ...jackSixFiveFourKeepKingQueenDiscard,
    sortOrder: SortOrder.Descending,
  });

export const JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted: Story =
  createStory({
    ...jackSixFiveFourKeepKingQueenDiscard,
    isHighlighted: true,
    sortOrder: SortOrder.Descending,
  });

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

export const ExpandedRow: Story = {
  ...JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted,
  play: playToggle,
};

export const DoubleExpandedRow: Story = {
  ...ExpandedRow,
  play: (context) => playToggle(context, { toggleStarterDetails: true }),
};
