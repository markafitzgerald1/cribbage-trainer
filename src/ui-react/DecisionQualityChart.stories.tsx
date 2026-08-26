import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { DecisionQualityChart } from "./DecisionQualityChart";
import type { DiscardPeriodBucket } from "../ui/discardQualityTrend";

const sampleBuckets: DiscardPeriodBucket[] = [
  {
    decisions: 20,
    endTime: 1700003600000,
    key: "1-20",
    label: "Decisions 1–20",
    meanExpectedPointsLoss: 0.65,
    optimalDecisions: 10,
    skippedHands: 1,
    startTime: 1700000000000,
  },
  {
    decisions: 20,
    endTime: 1700007200000,
    key: "21-40",
    label: "Decisions 21–40",
    meanExpectedPointsLoss: 0.35,
    optimalDecisions: 14,
    skippedHands: 0,
    startTime: 1700003600000,
  },
  {
    decisions: 15,
    endTime: 1700010800000,
    key: "41-55",
    label: "Decisions 41–55",
    meanExpectedPointsLoss: 0.12,
    optimalDecisions: 12,
    skippedHands: 2,
    startTime: 1700007200000,
  },
];

const meta = {
  args: {
    buckets: sampleBuckets,
    granularity: "rolling20",
  },
  component: DecisionQualityChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "DecisionQualityChart",
} satisfies Meta<typeof DecisionQualityChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const expectChart = async (canvasElement: HTMLElement): Promise<void> => {
  const chart = within(canvasElement).getByRole("img", {
    name: "Decision quality over time trend chart",
  });

  await expect(chart).toBeVisible();
};

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expectChart(canvasElement);
  },
};

export const SinglePeriod: Story = {
  args: {
    buckets: [sampleBuckets[0]!],
    granularity: "rolling20",
  },
};

export const Empty: Story = {
  args: {
    buckets: [],
    granularity: "rolling20",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain(
      "No discard decisions recorded yet",
    );
  },
};
