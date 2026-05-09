import "./vars.css";
import { type Card, Rank } from "../game/Card";
import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  type StoryObj,
  createArgTypes,
} from "./stories.common";
import { CutResultRow } from "./CutResultRow";

const FOUR_POINTS = 4;
const SIX_POINTS = 6;
const TEN_POINTS = 10;

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: CutResultRow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "CutResultRow",
} satisfies Meta<typeof CutResultRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const SHARED_BASE_ARGS = {
  sortOrder: SortOrder.Descending,
} as const;

const ZERO_POINTS = {
  fifteensPoints: 0,
  flushesPoints: 0,
  nobsPoints: 0,
  pairsPoints: 0,
  runsPoints: 0,
};

const MULTIPLE_CUTS = [Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING];
const MULTIPLE_CUTS_SHARED_ARGS = {
  ...SHARED_BASE_ARGS,
  ...ZERO_POINTS,
  cuts: MULTIPLE_CUTS,
  totalPoints: SIX_POINTS,
};

export const SingleCut: Story = {
  args: {
    ...SHARED_BASE_ARGS,
    ...ZERO_POINTS,
    cuts: [Rank.FIVE],
    fifteensPoints: 2,
    pairsPoints: 2,
    totalPoints: FOUR_POINTS,
  },
};

export const MultipleCutsDescending: Story = {
  args: {
    ...MULTIPLE_CUTS_SHARED_ARGS,
  },
};

export const MultipleCutsAscending: Story = {
  args: {
    ...MULTIPLE_CUTS_SHARED_ARGS,
    sortOrder: SortOrder.Ascending,
  },
};

export const AllCategories: Story = {
  args: {
    ...SHARED_BASE_ARGS,
    cuts: [Rank.ACE],
    fifteensPoints: 2,
    flushesPoints: 4,
    nobsPoints: 1,
    pairsPoints: 0,
    runsPoints: 3,
    totalPoints: TEN_POINTS,
  },
};

export const NoPoints: Story = {
  args: {
    ...SHARED_BASE_ARGS,
    ...ZERO_POINTS,
    cuts: [Rank.KING],
    totalPoints: 0,
  },
};

export const SameRankCuts: Story = {
  args: {
    ...SHARED_BASE_ARGS,
    ...ZERO_POINTS,
    cuts: [
      { rank: Rank.FIVE, suit: "H" } as unknown as Card,
      { rank: Rank.FIVE, suit: "D" } as unknown as Card,
    ],
    fifteensPoints: 2,
    pairsPoints: 2,
    totalPoints: FOUR_POINTS,
  },
};

export const MultipleSameRankRanks: Story = {
  args: {
    ...SHARED_BASE_ARGS,
    ...ZERO_POINTS,
    cuts: [Rank.FIVE, Rank.FIVE],
    fifteensPoints: 2,
    pairsPoints: 2,
    totalPoints: FOUR_POINTS,
  },
};
