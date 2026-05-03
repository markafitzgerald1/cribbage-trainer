import "./vars.css";
/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
/* jscpd:ignore-end */
import { PointsCell } from "./PointsCell";

const TWO_POINTS = 2;
const FOUR_POINTS = 4;
const SIX_POINTS = 6;

const meta = {
  component: PointsCell,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "PointsCell",
} satisfies Meta<typeof PointsCell>;

/* jscpd:ignore-start */
export default meta;
type Story = StoryObj<typeof meta>;

const createStory = (points: number): Story => ({
  args: { points },
});

export const NoPoints: Story = createStory(0);
export const TwoPoints: Story = createStory(TWO_POINTS);
export const FourPoints: Story = createStory(FOUR_POINTS);
export const SixPoints: Story = createStory(SIX_POINTS);
/* jscpd:ignore-end */
