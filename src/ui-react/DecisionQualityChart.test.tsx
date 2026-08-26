import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import * as classes from "./DecisionQualityChart.module.css";
import {
  DecisionQualityChart,
  getLatestLoss,
  getLossColor,
  getMinLabelDistance,
  getXLabelAnchor,
} from "./DecisionQualityChart";
import type {
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
  severity: {
    halfToOne: 2,
    optimal: 5,
    overOne: 1,
    quarterToHalf: 1,
    upToQuarter: 1,
  },
  skippedHands: 1,
  startTime: 1700000000000,
});

const renderChart = (
  buckets: readonly DiscardPeriodBucket[],
  granularity: DiscardTrendGranularity,
) =>
  render(
    <DecisionQualityChart
      buckets={buckets}
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

  it("returns appropriate min label distance per granularity", () => {
    expect(getMinLabelDistance("week")).toBe(100);
    expect(getMinLabelDistance("day")).toBe(80);
    expect(getMinLabelDistance("month")).toBe(75);
    expect(getMinLabelDistance("rolling20")).toBe(40);
    expect(getMinLabelDistance("rolling50")).toBe(40);
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

  it("handles rolling labels format and sparse x-labels for many buckets", () => {
    const count = 15;
    const buckets = Array.from({ length: count }, (_, index) => ({
      ...makeBucket(`b${index}`, 0.25),
      label: `Decisions ${index * 20 + 1}–${(index + 1) * 20}`,
    }));
    const { getByRole } = renderChart(buckets, "rolling20");

    expect(getByRole("img")).toBeInTheDocument();
  });

  it("maps loss values to lower severity colors correctly", () => {
    expect(getLossColor(null)).toBe("#888888");
    expect(getLossColor(0)).toBe("#28a745");
    expect(getLossColor(0.2)).toBe("#70c878");
  });

  it("maps loss values to higher severity colors correctly", () => {
    expect(getLossColor(0.4)).toBe("#f0ad4e");
    expect(getLossColor(0.8)).toBe("#e67e22");
    expect(getLossColor(1.5)).toBe("#d9534f");
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
