import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import * as classes from "./DecisionQualityChart.module.css";
import {
  DecisionQualityChart,
  getLatestLoss,
  getLossColor,
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

  it("handles medium bucket counts (7 to 12) with alternating x-labels", () => {
    const count = 10;
    const buckets = Array.from({ length: count }, (_, index) =>
      makeBucket(`b${index}`, 0.25),
    );
    const { getByRole } = renderChart(buckets, "day");

    expect(getByRole("img")).toBeInTheDocument();
  });

  it("thins six weekly labels to keep the axis readable", () => {
    const buckets = Array.from({ length: 6 }, (_, index) => ({
      ...makeBucket(`week-${index}`, 0.25),
      label: `Aug ${index * 7 + 3}–${index * 7 + 9}, 2026`,
    }));
    const { container } = renderChart(buckets, "week");

    expect(container.querySelectorAll(`.${classes.xLabel}`)).toHaveLength(3);
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
});
