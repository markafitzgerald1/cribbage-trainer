/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
/* jscpd:ignore-end */
import { CutResultRow } from "./CutResultRow";
import { Rank } from "../game/Card";

const SINGLE_CUT_COUNT = 4;
const MULTI_CUT_COUNT = 8;
const THREE_CUT_COUNT = 3;
const TWO_POINTS = 2;
const FOUR_POINTS = 4;
const SIX_POINTS = 6;
const TEN_POINTS = 10;

const meta = {
  component: CutResultRow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "CutResultRow",
} satisfies Meta<typeof CutResultRow>;

/* jscpd:ignore-start */
export default meta;
type Story = StoryObj<typeof meta>;
/* jscpd:ignore-end */

export const SingleCut: Story = {
  args: {
    cutCount: SINGLE_CUT_COUNT,
    cuts: [Rank.FIVE],
    fifteensPoints: FOUR_POINTS,
    pairsPoints: 0,
    runsPoints: 0,
    totalPoints: FOUR_POINTS,
  },
};

export const MultipleCuts: Story = {
  args: {
    cutCount: MULTI_CUT_COUNT,
    cuts: [Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING],
    fifteensPoints: TWO_POINTS,
    pairsPoints: FOUR_POINTS,
    runsPoints: 0,
    totalPoints: SIX_POINTS,
  },
};

export const AllCategories: Story = {
  args: {
    cutCount: THREE_CUT_COUNT,
    cuts: [Rank.ACE],
    fifteensPoints: TWO_POINTS,
    pairsPoints: TWO_POINTS,
    runsPoints: SIX_POINTS,
    totalPoints: TEN_POINTS,
  },
};

export const NoPoints: Story = {
  args: {
    cutCount: SINGLE_CUT_COUNT,
    cuts: [Rank.KING],
    fifteensPoints: 0,
    pairsPoints: 0,
    runsPoints: 0,
    totalPoints: 0,
  },
};
