/* jscpd:ignore-start */
import * as classes from "./MistakeQueueDialog.module.css";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DialogSummaryCards } from "./DialogSummaryCards";

const meta = {
  component: DialogSummaryCards,
  parameters: {
    docs: {
      description: {
        component: "Summary metrics cards displayed at top of dialog windows.",
      },
    },
  },
  tags: ["autodocs"],
  title: "DialogSummaryCards",
} satisfies Meta<typeof DialogSummaryCards>;

export default meta;
type Story = StoryObj<typeof meta>;
/* jscpd:ignore-end */

export const Default: Story = {
  args: {
    classes,
    metrics: [
      { label: "Total mistakes", value: 12 },
      { label: "Needs practice", value: 8 },
      { label: "Mastered", value: 4 },
    ],
  },
};

export const TrendMetrics: Story = {
  args: {
    classes,
    metrics: [
      { label: "Total decisions", value: 45 },
      { label: "Optimal decisions", value: 38 },
      { label: "Average loss", value: "0.42 pts" },
      { label: "Skipped hands", value: 2 },
    ],
  },
};

export const SingleMetric: Story = {
  args: {
    classes,
    metrics: [{ label: "Active hands", value: 5 }],
  },
};
