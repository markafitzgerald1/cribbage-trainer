import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import * as classes from "./DecisionQualityChart.module.css";
import {
  DATA_POINT_COLOR,
  DecisionQualityChart,
  OPTIMAL_POINT_COLOR,
  type PositionedLabel,
  calculateMaxLossY,
  createAdaptiveChartTicks,
  createChartTicks,
  filterSpacedLabels,
  getLabelBounds,
  getLatestLoss,
  getLossPointColor,
  getXLabelAnchor,
  selectTickStep,
} from "./DecisionQualityChart";
import type {
  DiscardDecisionPoint,
  DiscardPeriodBucket,
  DiscardTrendGranularity,
} from "../ui/discardQualityTrend";
import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react";

const makeBucket = (
  key: string,
  loss: number | null,
  decisions = 10,
): DiscardPeriodBucket => ({
  decisions,
  endTime: 1700003600000,
  key,
  label: `Period ${key}`,
  meanExpectedPointsLoss: loss,
  optimalDecisions: 5,
  skippedHands: 1,
  startTime: 1700000000000,
});

const renderChart = (
  buckets: readonly DiscardPeriodBucket[],
  granularity: DiscardTrendGranularity,
  decisionPoints?: readonly DiscardDecisionPoint[],
) =>
  render(
    <DecisionQualityChart
      buckets={buckets}
      decisionPoints={decisionPoints}
      granularity={granularity}
    />,
  );

const countRenderedXLabels = (
  buckets: readonly DiscardPeriodBucket[],
  granularity: DiscardTrendGranularity,
): number => {
  const { container } = renderChart(buckets, granularity);
  return container.querySelectorAll(`.${classes.xLabel}`).length;
};

const makeDecisionPoint = (
  ordinal: number,
  expectedPointsLoss: number,
  rollingMeanLoss: number,
) => ({
  expectedPointsLoss,
  isOptimal: expectedPointsLoss === 0,
  isRetained: false,
  ordinal,
  rollingMeanLoss,
  timestamp: 1700000000000 + ordinal * 1000,
});

const makeRetainedDecisionPoint = (
  ordinal: number,
  expectedPointsLoss: number,
  rollingMeanLoss: number,
) => ({
  ...makeDecisionPoint(ordinal, expectedPointsLoss, rollingMeanLoss),
  isRetained: true,
});

describe("decision quality chart", () => {
  it("renders empty-state message when buckets array is empty", () => {
    const { getByText } = renderChart([], "rolling20");

    expect(
      getByText("No discard decisions recorded yet for this view."),
    ).toBeInTheDocument();
  });

  it("renders empty-state message when all buckets have null mean loss", () => {
    const { getByText } = renderChart([makeBucket("b1", null, 0)], "day");

    expect(
      getByText("No discard decisions recorded yet for this view."),
    ).toBeInTheDocument();
  });

  it("renders SVG with role img and data points for single bucket", () => {
    const { getByRole, container } = renderChart(
      [makeBucket("b1", 0.4, 10)],
      "day",
    );
    const svg = getByRole("img");

    expect(svg).toBeInTheDocument();
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });

  it("renders SVG trend line and skips null loss points in mixed buckets", () => {
    const buckets = [
      makeBucket("b1", 0.6),
      makeBucket("b2", null, 0),
      makeBucket("b3", 0.2),
      makeBucket("b4", 0.0),
    ];
    const { container } = renderChart(buckets, "day");

    expect(container.querySelector("path")).toBeInTheDocument();
    expect(container.querySelectorAll("circle")).toHaveLength(3);
  });

  it("spaces calendar chart points by elapsed time", () => {
    const buckets = [
      { ...makeBucket("January", 0.2), startTime: 0 },
      { ...makeBucket("February", 0.4), startTime: 10 },
      { ...makeBucket("December", 0.6), startTime: 110 },
    ];
    const { container } = renderChart(buckets, "month");
    const points = container.querySelectorAll("circle");

    expect(points[0]).toHaveAttribute("cx", "45");
    expect(points[1]).toHaveAttribute("cx", expect.stringContaining("85."));
    expect(points[2]).toHaveAttribute("cx", "495");
  });

  it("thins daily labels to prevent overlapping text across consecutive days", () => {
    const dailyBuckets = Array.from({ length: 10 }, (_, dayOffset) => ({
      ...makeBucket(`d-${dayOffset}`, 0.25),
      label: `Aug ${dayOffset + 10}, 2026`,
      startTime: dayOffset * 86_400_000,
    }));

    expect(countRenderedXLabels(dailyBuckets, "day")).toBeLessThan(10);
  });

  it("thins six weekly labels to keep the axis readable", () => {
    const buckets = Array.from({ length: 6 }, (_, index) => ({
      ...makeBucket(`week-${index}`, 0.25),
      label: `Aug ${index * 7 + 3}–${index * 7 + 9}, 2026`,
      startTime: index * 7 * 86_400_000,
    }));

    expect(countRenderedXLabels(buckets, "week")).toBe(3);
  });

  it("skips overlapping weekly labels in sparse calendar history", () => {
    const buckets = [
      {
        ...makeBucket("w1", 0.2),
        label: "Jan 1–7, 2026",
        startTime: 0,
      },
      {
        ...makeBucket("w2", 0.3),
        label: "Jan 8–14, 2026",
        startTime: 7 * 86_400_000,
      },
      {
        ...makeBucket("w3", 0.4),
        label: "Dec 1–7, 2026",
        startTime: 334 * 86_400_000,
      },
    ];

    expect(countRenderedXLabels(buckets, "week")).toBe(2);
  });

  it("aligns endpoint labels with start and end anchors to keep text inside chart", () => {
    const buckets = [
      {
        ...makeBucket("w1", 0.2),
        label: "Dec 29, 2025 – Jan 4, 2026",
        startTime: 0,
      },
      {
        ...makeBucket("w2", 0.4),
        label: "Aug 10–16, 2026",
        startTime: 200 * 86_400_000,
      },
    ];
    const { container } = renderChart(buckets, "week");
    const labels = container.querySelectorAll(`.${classes.xLabel}`);

    expect(labels[0]).toHaveAttribute("text-anchor", "start");
    expect(labels[1]).toHaveAttribute("text-anchor", "end");
  });

  it("calculates x-label anchors based on position and endpoint bounds", () => {
    expect(getXLabelAnchor(45, 0, 1)).toBe("middle");
    expect(getXLabelAnchor(45, 0, 3)).toBe("start");
    expect(getXLabelAnchor(270, 1, 3)).toBe("middle");
    expect(getXLabelAnchor(495, 2, 3)).toBe("end");
  });

  it("calculates label bounding intervals based on text length and anchor", () => {
    const startBounds = getLabelBounds(
      "Dec 29, 2025 – Jan 4, 2026",
      45,
      "start",
    );

    expect(startBounds.left).toBe(45);
    expect(startBounds.right).toBeGreaterThan(150);

    const endBounds = getLabelBounds("Aug 10–16, 2026", 495, "end");

    expect(endBounds.right).toBe(495);
    expect(endBounds.left).toBeLessThan(495);
  });

  it("prevents overlapping x-labels even with wide cross-year weekly labels", () => {
    const firstBucket = {
      ...makeBucket("w0", 0.2),
      label: "Dec 29, 2025 – Jan 4, 2026",
      startTime: 0,
    };
    const otherBuckets = Array.from({ length: 9 }, (_, index) => ({
      ...makeBucket(`w${index + 1}`, 0.2),
      label: `Week ${index + 2}, 2026`,
      startTime: (index + 1) * 7 * 86_400_000,
    }));
    const buckets = [firstBucket, ...otherBuckets];

    expect(countRenderedXLabels(buckets, "week")).toBeGreaterThanOrEqual(2);
  });

  it("handles empty and single-item arrays in filterSpacedLabels", () => {
    expect(filterSpacedLabels([])).toStrictEqual([]);

    const single: PositionedLabel = {
      bucket: makeBucket("1", 0.2),
      label: "Jan 1, 2026",
      xPosition: 45,
    };

    expect(filterSpacedLabels([single])).toStrictEqual([single]);
  });

  it("handles rolling labels format and sparse x-labels for many buckets", () => {
    const count = 15;
    const buckets = Array.from({ length: count }, (_, index) => ({
      ...makeBucket(`b${index}`, 0.25),
      label: `Decisions ${index * 20 + 1}–${(index + 1) * 20}`,
    }));
    const { getByRole } = renderChart(buckets, "rolling20");

    expect(getByRole("img")).toBeInTheDocument();
  });

  it("maps loss values to point colors correctly", () => {
    expect(getLossPointColor(null)).toBe(DATA_POINT_COLOR);
    expect(getLossPointColor(0)).toBe(OPTIMAL_POINT_COLOR);
    expect(getLossPointColor(0.2)).toBe(DATA_POINT_COLOR);
    expect(getLossPointColor(1.5)).toBe(DATA_POINT_COLOR);
  });

  it("handles empty points array in getLatestLoss", () => {
    expect(getLatestLoss([])).toBe("0.00");
  });

  it("describes the latest scored period when the most recent period is skip-only", () => {
    const buckets = [makeBucket("b1", 0.4), makeBucket("b2", null, 0)];
    const { container } = renderChart(buckets, "day");
    const desc = container.querySelector("desc");

    expect(desc).toHaveTextContent(
      "Trend chart with 2 periods. Latest scored period (Period b1) average expected loss is 0.40 points.",
    );
  });
});

describe("decision quality chart rolling mode and points", () => {
  it("renders continuous decision points with loss stems and optimal baseline dots in rolling mode", () => {
    const buckets = [makeBucket("b1", 0.4)];
    const decisionPoints = [
      makeDecisionPoint(1, 0, 0),
      makeDecisionPoint(2, 0.8, 0.4),
    ];
    const { container, getByRole } = renderChart(
      buckets,
      "rolling20",
      decisionPoints,
    );

    expect(getByRole("img")).toBeInTheDocument();
    expect(container.querySelectorAll(`.${classes.optimalDot}`)).toHaveLength(
      1,
    );
    expect(container.querySelectorAll(`.${classes.lossStem}`)).toHaveLength(1);
    expect(container.querySelectorAll(`.${classes.lossDot}`)).toHaveLength(1);
    expect(
      container.querySelector(`.${classes.trendLine}`),
    ).toBeInTheDocument();
  });

  it.each([
    {
      expectedLoss: "0.00",
      granularity: "rolling20" as const,
      loss: 0,
      windowSize: 1,
    },
    {
      expectedLoss: "0.30",
      granularity: "rolling50" as const,
      loss: 0.3,
      windowSize: 1,
    },
  ])(
    "describes single decision point under $granularity",
    ({ expectedLoss, granularity, loss, windowSize }) => {
      const { container, getByRole } = renderChart(
        [makeBucket("b1", loss)],
        granularity,
        [makeDecisionPoint(1, loss, loss)],
      );

      expect(getByRole("img")).toBeInTheDocument();
      expect(container.querySelector("desc")).toHaveTextContent(
        `Trend chart with 1 decisions (${windowSize}-decision rolling average). Latest average expected loss is ${expectedLoss} points.`,
      );
    },
  );

  it("describes full rolling window when decisions exceed batch size", () => {
    const points = Array.from({ length: 25 }, (_, index) =>
      makeDecisionPoint(index + 1, 0.2, 0.2),
    );
    const { container, getByText } = renderChart(
      [makeBucket("b1", 0.2)],
      "rolling20",
      points,
    );

    expect(
      getByText("Latest 20-decision rolling average: 0.20 points loss"),
    ).toBeInTheDocument();

    expect(container.querySelector("desc")).toHaveTextContent(
      "Trend chart with 25 decisions (20-decision rolling average). Latest average expected loss is 0.20 points.",
    );
  });

  it("renders retained decision prefix in tooltips and x-axis when isRetained is true", () => {
    const points = [
      makeRetainedDecisionPoint(1, 0, 0),
      makeRetainedDecisionPoint(2, 0.45, 0.22),
    ];
    const { container, getByText } = renderChart(
      [makeBucket("b1", 0.22)],
      "rolling20",
      points,
    );

    expect(
      getByText("Retained decision #1: 0.00 points loss (optimal)"),
    ).toBeInTheDocument();

    expect(
      getByText("Retained decision #2: 0.45 points loss"),
    ).toBeInTheDocument();

    const xLabels = container.querySelectorAll(`.${classes.xLabel}`);

    expect(xLabels[0]?.textContent).toBe("R#1");
    expect(xLabels[1]?.textContent).toBe("R#2");
  });

  it("describes capped recent horizon when totalDecisions exceeds points length", () => {
    const points = Array.from({ length: 100 }, (_, index) =>
      makeDecisionPoint(index + 26, 0.25, 0.25),
    );
    const { container } = render(
      <DecisionQualityChart
        buckets={[makeBucket("b1", 0.25)]}
        decisionPoints={points}
        granularity="rolling20"
        totalDecisions={125}
      />,
    );

    expect(container.querySelector("desc")).toHaveTextContent(
      "Trend chart with the most recent 100 of 125 decisions (20-decision rolling average). Latest average expected loss is 0.25 points.",
    );
  });

  it.each([
    { expectedStep: 0.5, loss: 0.2 },
    { expectedStep: 0.5, loss: 1.0 },
    { expectedStep: 0.5, loss: 2.5 },
    { expectedStep: 1.0, loss: 3.0 },
    { expectedStep: 2.0, loss: 8.5 },
    { expectedStep: 5.0, loss: 18.86 },
    { expectedStep: 10.0, loss: 45 },
    { expectedStep: 20.0, loss: 85 },
    { expectedStep: 20.0, loss: 250 },
  ])(
    "selects adaptive tick step $expectedStep for loss $loss",
    ({ expectedStep, loss }) => {
      expect(selectTickStep(loss)).toBe(expectedStep);
    },
  );

  it("calculates max loss and creates high loss ticks with step", () => {
    expect(calculateMaxLossY(0.4, 0.5)).toBe(1.0);
    expect(calculateMaxLossY(18.86, 5.0)).toBe(20.0);

    const highLossTicks = createChartTicks(20.0, 5.0);

    expect(highLossTicks).toHaveLength(5);
    expect(highLossTicks[0]?.label).toBe("0.0 (Opt)");
    expect(highLossTicks[4]?.label).toBe("20.0");
  });

  it("creates adaptive chart ticks combining step, bounds, and ticks", () => {
    const { maxLossY, ticks } = createAdaptiveChartTicks(18.86);

    expect(maxLossY).toBe(20.0);
    expect(ticks).toHaveLength(5);
    expect(ticks[1]?.label).toBe("5.0");
  });

  it("renders legible tick count in chart when decision loss is very high", () => {
    const { container } = renderChart([makeBucket("b1", 18.86)], "rolling20", [
      makeDecisionPoint(1, 18.86, 18.86),
    ]);

    const tickLines = container.querySelectorAll(`.${classes.gridLine}`);

    expect(tickLines.length).toBeLessThanOrEqual(5);
  });
});
