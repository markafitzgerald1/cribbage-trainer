/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BreakdownSection } from "./BreakdownSection";
import { CARDS } from "../game/Card";
/* jscpd:ignore-end */

const meta = {
  component: BreakdownSection,
  parameters: {
    backgrounds: { default: "dark" },
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "BreakdownSection",
} satisfies Meta<typeof BreakdownSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoContributions: Story = {
  args: {
    average: 0,
    contributions: [],
    label: "Expected cut-added 15s",
  },
};

export const SingleContribution: Story = {
  args: {
    average: 0.52,
    contributions: [{ count: 4, cutCard: CARDS.FIVE, points: 2 }],
    label: "Expected cut-added 15s",
  },
};

/* jscpd:ignore-start - story data is inherently repetitive */
export const MultipleContributions: Story = {
  args: {
    average: 2.0,
    contributions: [
      { count: 4, cutCard: CARDS.ACE, points: 2 },
      { count: 3, cutCard: CARDS.TWO, points: 2 },
      { count: 3, cutCard: CARDS.THREE, points: 2 },
      { count: 4, cutCard: CARDS.FOUR, points: 2 },
      { count: 3, cutCard: CARDS.FIVE, points: 2 },
      { count: 3, cutCard: CARDS.SIX, points: 2 },
      { count: 4, cutCard: CARDS.SEVEN, points: 2 },
    ],
    label: "Expected cut-added 15s",
  },
};

export const PairsExample: Story = {
  args: {
    average: 0.52,
    contributions: [
      { count: 3, cutCard: CARDS.THREE, points: 2 },
      { count: 3, cutCard: CARDS.FIVE, points: 2 },
      { count: 3, cutCard: CARDS.SIX, points: 2 },
      { count: 3, cutCard: CARDS.SEVEN, points: 2 },
    ],
    label: "Expected cut-added pairs",
  },
};

export const RunsExample: Story = {
  args: {
    average: 0.85,
    contributions: [
      { count: 4, cutCard: CARDS.FOUR, points: 2 },
      { count: 3, cutCard: CARDS.FIVE, points: 3 },
      { count: 3, cutCard: CARDS.SIX, points: 3 },
      { count: 3, cutCard: CARDS.SEVEN, points: 3 },
      { count: 4, cutCard: CARDS.EIGHT, points: 1 },
    ],
    label: "Expected cut-added runs",
  },
};
/* jscpd:ignore-end */
