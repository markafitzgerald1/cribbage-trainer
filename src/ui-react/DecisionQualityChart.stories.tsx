import type {
  DiscardDecisionPoint,
  DiscardPeriodBucket,
} from "../ui/discardQualityTrend";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, waitFor, within } from "storybook/test";
import { DecisionQualityChart } from "./DecisionQualityChart";
import { SortOrder } from "../ui/SortOrder";
import { originalIdentity } from "./PracticeDrillPanel.test.common";
import { playPracticeFromDecisionMarker } from "./stories.common";

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
  const chart = within(canvasElement).getByRole("group", {
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
  { loss: 0, mastered: false, mean: 0 },
  { loss: 0.5, mastered: true, mean: 0.25 },
  { loss: 1.2, mastered: false, mean: 0.57 },
  { loss: 0, mastered: false, mean: 0.43 },
  { loss: 0.25, mastered: false, mean: 0.39 },
].map(({ loss, mastered, mean }, index) => ({
  discardKey: "5H,6H",
  expectedPointsLoss: loss,
  handKey: "5H,6H,7H,8H,9H,10H|Dealer",
  isMastered: mastered,
  isOptimal: loss === 0,
  isPracticeEligible: loss > 0,
  isRetained: false,
  ordinal: index + 1,
  recencyAt: 1700000000000 + index,
  rollingMeanLoss: mean,
  tableIdentity: null,
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

    await expect(panel).toHaveTextContent("Recorded cost:");
    await expect(panel).toHaveTextContent("Dealer");
    await expect(panel).toHaveTextContent("Hand");
    await expect(panel).toHaveTextContent("Discarded");

    clickElement(marker);
    await expectPanelGone(canvasElement);

    clickElement(marker);
    await canvas.findByRole("region");
    await fireEvent.keyDown(window, { key: "Escape" });
    await expectPanelGone(canvasElement);

    clickElement(marker);
    clickElement(await canvas.findByRole("button", { name: "Dismiss" }));
    await expectPanelGone(canvasElement);
  },
};

export const PracticeFromDetail: Story = {
  args: {
    ...rollingWithPointsArgs,
    onPracticeDecision: fn(),
    sortOrder: SortOrder.Descending,
  },
  play: ({ args, canvasElement }) =>
    playPracticeFromDecisionMarker(canvasElement, args.onPracticeDecision),
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

export const EarlierRecordedDetail: Story = {
  args: {
    buckets: [
      { ...sampleBuckets[0]!, decisions: 1, meanExpectedPointsLoss: 0.004 },
    ],
    decisionPoints: [
      {
        ...sampleDecisionPoints[1]!,
        expectedPointsLoss: 0.004,
        ordinal: 1,
        rollingMeanLoss: 0.004,
        tableIdentity: originalIdentity,
      },
    ],
    granularity: "rolling20",
    onPracticeDecision: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const marker = canvas.getByRole("button", {
      name: "Decision #1: Recorded cost: less than 0.01 points, mastery kept from earlier retries. Select to see the hand.",
    });
    await fireEvent.click(marker);

    await expect(
      canvas.getByRole("note", {
        name: "Recorded cost for selected decision: less than 0.01 points",
      }),
    ).toHaveTextContent("Recorded cost: < 0.01 points");
    await expect(
      canvas.getByText("Mastered — mastery kept from earlier retries"),
    ).toBeVisible();

    await fireEvent.click(canvas.getByText("Judged with different tables"));

    await expect(
      canvas.getByText(
        `Crib: ${originalIdentity.crib.means_sha256.slice(0, 12)}…`,
      ),
    ).toBeVisible();

    await fireEvent.click(
      canvas.getByRole("button", { name: "Practice this hand" }),
    );

    await expect(args.onPracticeDecision).toHaveBeenCalledWith(
      args.decisionPoints![0],
    );
  },
};
