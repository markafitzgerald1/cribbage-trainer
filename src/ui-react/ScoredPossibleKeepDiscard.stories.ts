/* jscpd:ignore-start */
import { CARDS, type Card, Rank, Suit, createCard } from "../game/Card";
import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  type StoryObj,
  createArgTypes,
  playToggle,
} from "./stories.common";
import { expect, within } from "storybook/test";
import {
  expectedCutAddedPoints,
  toCutBreakdown,
} from "../game/expectedCutAddedPoints";
import { CribRole } from "../game/expectedCribPoints";
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
type StoryCard = ReturnType<typeof createCard>;

const toDealtCard = (
  card: StoryCard,
  index: number,
): Card & { readonly dealOrder: number } => ({
  ...card,
  dealOrder: index,
});

const cribStarterPoints = [
  {
    expectedCribPoints: 1.25,
    pointBreakdown: new Map<string, never>().get("missing"),
    remainingStarterCount: 4,
    signedExpectedCribPoints: 1.25,
    starterRank: "K",
    starterSuitRelationPoints: [],
  },
] as const;
const cribPointBreakdown = {
  fifteens: 0.3,
  flushes: 0.2,
  nobs: 0.1,
  pairs: 0.4,
  runs: 0.25,
} as const;
const suitedCribStarterPoints = [
  {
    expectedCribPoints: 4.5,
    pointBreakdown: cribPointBreakdown,
    remainingStarterCount: 3,
    signedExpectedCribPoints: 4.5,
    starterRank: "5",
    starterSuitRelationPoints: [
      {
        expectedCribPoints: 5.1,
        pointBreakdown: {
          fifteens: 1.1,
          flushes: 0.4,
          nobs: 0.1,
          pairs: 0.8,
          runs: 2.7,
        },
        relation: "matching_discard_suit",
        remainingStarterCount: 1,
        starterRank: "5",
        suits: [Suit.DIAMONDS],
      },
      {
        expectedCribPoints: 4.2,
        pointBreakdown: {
          fifteens: 0.8,
          flushes: 0,
          nobs: 0.2,
          pairs: 0.7,
          runs: 2.5,
        },
        relation: "non_matching_discard_suit",
        remainingStarterCount: 2,
        starterRank: "5",
        suits: [Suit.HEARTS, Suit.SPADES],
      },
    ],
  },
] as const;

interface CreateStoryOptions {
  readonly cribPoints?: number;
  readonly cribStarterPoints?:
    | typeof cribStarterPoints
    | typeof suitedCribStarterPoints;
  readonly discard: readonly StoryCard[];
  readonly expectedCribPointBreakdown?: typeof cribPointBreakdown;
  readonly isHighlighted?: boolean;
  readonly keep: readonly StoryCard[];
  readonly sortOrder: SortOrder;
}

const createStory = ({
  keep,
  discard,
  sortOrder,
  cribPoints = 1.25,
  cribStarterPoints: storyCribStarterPoints = cribStarterPoints,
  expectedCribPointBreakdown,
  isHighlighted = false,
}: CreateStoryOptions): Story => {
  const cutAdded = expectedCutAddedPoints(keep, discard);
  const handExpectedPoints = expectedHandPoints(keep, discard).total;
  const points = handPoints(keep);
  return {
    args: {
      cribRole: CribRole.Dealer,
      isHighlighted,
      rowIndex: 0,
      scoredKeepDiscard: {
        ...toCutBreakdown(cutAdded),
        cribStarterPoints: storyCribStarterPoints,
        discard: discard.map(toDealtCard),
        expectedCribPointBreakdown,
        expectedCribPoints: cribPoints,
        expectedHandPoints: handExpectedPoints,
        expectedNetPoints: handExpectedPoints + cribPoints,
        handPoints: points.total,
        handPointsBreakdown: points,
        keep: keep.map(toDealtCard),
        signedExpectedCribPoints: cribPoints,
      },
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

export const SuitedCribDetailsExpanded: Story = createStory({
  cribPoints: 4.5,
  cribStarterPoints: suitedCribStarterPoints,
  discard: [
    createCard(Rank.ACE, Suit.DIAMONDS),
    createCard(Rank.TWO, Suit.DIAMONDS),
  ],
  expectedCribPointBreakdown: cribPointBreakdown,
  isHighlighted: true,
  keep: [
    createCard(Rank.THREE, Suit.HEARTS),
    createCard(Rank.FOUR, Suit.SPADES),
    createCard(Rank.NINE, Suit.CLUBS),
    createCard(Rank.JACK, Suit.HEARTS),
  ],
  sortOrder: SortOrder.Ascending,
});

SuitedCribDetailsExpanded.play = async (context) => {
  await playToggle(context, { toggleCribDetails: true });

  const canvas = within(context.canvasElement);

  await expect(await canvas.findByText("5.10")).toBeVisible();

  await expect(await canvas.findByText("4.20")).toBeVisible();
};
/* jscpd:ignore-end */
