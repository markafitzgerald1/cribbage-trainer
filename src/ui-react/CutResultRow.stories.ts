import "./vars.css";
import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  type StoryObj,
  createArgTypes,
} from "./stories.common";
import { CutResultRow } from "./CutResultRow";
import { Rank } from "../game/Card";

const TWO_POINTS = 2;
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
  flushesPoints: 0,
  nobsPoints: 0,
  runsPoints: 0,
  sortOrder: SortOrder.Descending,
} as const;

const MULTIPLE_CUTS = [Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING];
const MULTIPLE_CUTS_SHARED_ARGS = {
  ...SHARED_BASE_ARGS,
  cuts: MULTIPLE_CUTS,
  fifteensPoints: TWO_POINTS,
  pairsPoints: FOUR_POINTS,
  totalPoints: SIX_POINTS,
};

export const SingleCut: Story = {
  args: {
    ...SHARED_BASE_ARGS,
    cuts: [Rank.FIVE],
    fifteensPoints: FOUR_POINTS,
    pairsPoints: 0,
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
    fifteensPoints: TWO_POINTS,
    pairsPoints: TWO_POINTS,
    runsPoints: SIX_POINTS,
    totalPoints: TEN_POINTS,
  },
};

export const NoPoints: Story = {
  args: {
    ...SHARED_BASE_ARGS,
    cuts: [Rank.KING],
    fifteensPoints: 0,
    pairsPoints: 0,
    totalPoints: 0,
  },
};
