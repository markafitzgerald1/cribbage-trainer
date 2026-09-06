import type {
  DiscardDecisionPoint,
  DiscardPeriodBucket,
} from "../ui/discardQualityTrend";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, waitFor, within } from "storybook/test";
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
  discardKey: "5H,6H",
  expectedPointsLoss: loss,
  handKey: "5H,6H,7H,8H,9H,10H|Dealer",
  isOptimal: loss === 0,
  isRetained: false,
  ordinal: index + 1,
  rollingMeanLoss: mean,
  timestamp: 1700000000000 + index * 100000,
}));

const rollingWithPointsArgs = {
  buckets: sampleBuckets,
  decisionPoints: sampleDecisionPoints,
  granularity: "rolling20",
} satisfies Story["args"];

export const WithDecisionPoints: Story = {
  args: rollingWithPointsArgs,
  play: playExpectChart,
};

const firstLossMarker = (canvasElement: HTMLElement): Element => {
  const marker = canvasElement.querySelector("[data-decision-ordinal]");
  if (marker === null) {
    throw new Error("expected a loss marker in the chart");
  }
  return marker;
};

const clickElement = (element: Element): void => {
  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
};

const expectPanelGone = async (canvasElement: HTMLElement): Promise<void> => {
  await waitFor(async () => {
    await expect(
      within(canvasElement).queryByRole("region"),
    ).not.toBeInTheDocument();
  });
};

export const DecisionDetailPopup: Story = {
  args: rollingWithPointsArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const marker = firstLossMarker(canvasElement);

    clickElement(marker);
    const panel = await canvas.findByRole("region");

    await expect(panel).toHaveTextContent("lost");
    await expect(panel).toHaveTextContent("Hand");
    await expect(panel).toHaveTextContent("Discarded");

    clickElement(marker);
    await expectPanelGone(canvasElement);

    clickElement(marker);
    await canvas.findByRole("region");
    await fireEvent.keyDown(window, { key: "Escape" });
    await expectPanelGone(canvasElement);

    clickElement(marker);
    clickElement(await canvas.findByRole("button", { name: "Close" }));
    await expectPanelGone(canvasElement);
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
