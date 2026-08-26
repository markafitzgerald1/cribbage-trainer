import type {
  DiscardDecisionPoint,
  DiscardPeriodBucket,
} from "../ui/discardQualityTrend";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { DecisionQualityChart } from "./DecisionQualityChart";

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

const playExpectChart: Story["play"] = async ({ canvasElement }) => {
  await expectChart(canvasElement);
};

export const Default: Story = {
  play: playExpectChart,
};

export const SinglePeriod: Story = {
  args: {
    buckets: [sampleBuckets[0]!],
    granularity: "rolling20",
  },
};

const sampleDecisionPoints: DiscardDecisionPoint[] = [
  { loss: 0, mean: 0 },
  { loss: 0.5, mean: 0.25 },
  { loss: 1.2, mean: 0.57 },
  { loss: 0, mean: 0.43 },
  { loss: 0.25, mean: 0.39 },
].map(({ loss, mean }, index) => ({
  expectedPointsLoss: loss,
  isOptimal: loss === 0,
  isRetained: false,
  ordinal: index + 1,
  rollingMeanLoss: mean,
  timestamp: 1700000000000 + index * 100000,
}));

export const WithDecisionPoints: Story = {
  args: {
    buckets: sampleBuckets,
    decisionPoints: sampleDecisionPoints,
    granularity: "rolling20",
  },
  play: playExpectChart,
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
