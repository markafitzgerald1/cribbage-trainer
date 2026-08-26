import * as classes from "./DecisionQualityChart.module.css";
import type {
  DiscardPeriodBucket,
  DiscardTrendGranularity,
} from "../ui/discardQualityTrend";
import React, { useId } from "react";

export interface DecisionQualityChartProps {
  readonly buckets: readonly DiscardPeriodBucket[];
  readonly granularity: DiscardTrendGranularity;
}

const SVG_WIDTH = 520;
const SVG_HEIGHT = 200;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 45;
const MARGIN_LEFT = 45;
const MARGIN_RIGHT = 25;
const PLOT_WIDTH = SVG_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const PLOT_HEIGHT = SVG_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

const MIN_MAX_LOSS = 1.0;
const LOSS_STEP = 0.5;
const CHAR_WIDTH = 5.6;
const LABEL_SAFETY_MARGIN = 8;
const ENDPOINT_ANCHOR_THRESHOLD = 20;
const HALF_DIVISOR = 2;
const TICK_OFFSET_X = 6;
const TICK_OFFSET_Y = 3.5;
const X_LABEL_OFFSET_Y = 22;
const DECIMAL_PLACES = 2;
const TICK_LABEL_X = MARGIN_LEFT - TICK_OFFSET_X;
const POINT_RADIUS = 4.5;
const LAST_INDEX = -1;

export const OPTIMAL_POINT_COLOR = "#28a745";
export const DATA_POINT_COLOR = "#70c878";

export const getLossPointColor = (loss: number | null): string =>
  loss === 0 ? OPTIMAL_POINT_COLOR : DATA_POINT_COLOR;

export interface ChartPoint {
  readonly bucket: DiscardPeriodBucket;
  readonly color: string;
  readonly loss: number;
  readonly xPosition: number;
  readonly yPosition: number;
}

interface ChartTick {
  readonly isOptimal: boolean;
  readonly label: string;
  readonly value: number;
  readonly yPosition: number;
}

const calculateIndexedX = (index: number, total: number): number => {
  if (total === 1) {
    return MARGIN_LEFT + PLOT_WIDTH / HALF_DIVISOR;
  }
  return MARGIN_LEFT + (index / (total - 1)) * PLOT_WIDTH;
};

const calculateCalendarX = (
  timestamp: number,
  buckets: readonly DiscardPeriodBucket[],
): number => {
  const [firstBucket] = buckets;
  const lastBucket = buckets.at(LAST_INDEX);

  if (
    !firstBucket ||
    !lastBucket ||
    firstBucket.startTime === lastBucket.startTime
  ) {
    return MARGIN_LEFT + PLOT_WIDTH / HALF_DIVISOR;
  }

  return (
    MARGIN_LEFT +
    ((timestamp - firstBucket.startTime) /
      (lastBucket.startTime - firstBucket.startTime)) *
      PLOT_WIDTH
  );
};

interface CalculateXOptions {
  readonly bucket: DiscardPeriodBucket;
  readonly buckets: readonly DiscardPeriodBucket[];
  readonly granularity: DiscardTrendGranularity;
  readonly index: number;
}

const calculateX = ({
  bucket,
  buckets,
  granularity,
  index,
}: CalculateXOptions): number =>
  granularity === "rolling20" || granularity === "rolling50"
    ? calculateIndexedX(index, buckets.length)
    : calculateCalendarX(bucket.startTime, buckets);

const calculateY = (loss: number, maxLossY: number): number => {
  const clamped = Math.max(0, Math.min(loss, maxLossY));
  return MARGIN_TOP + PLOT_HEIGHT - (clamped / maxLossY) * PLOT_HEIGHT;
};

const createChartPoints = (
  buckets: readonly DiscardPeriodBucket[],
  granularity: DiscardTrendGranularity,
  maxLossY: number,
): ChartPoint[] =>
  buckets.flatMap((bucket, index) => {
    if (bucket.meanExpectedPointsLoss === null) {
      return [];
    }
    return [
      {
        bucket,
        color: getLossPointColor(bucket.meanExpectedPointsLoss),
        loss: bucket.meanExpectedPointsLoss,
        xPosition: calculateX({ bucket, buckets, granularity, index }),
        yPosition: calculateY(bucket.meanExpectedPointsLoss, maxLossY),
      },
    ];
  });

const formatPathData = (points: readonly ChartPoint[]): string =>
  points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.xPosition.toFixed(1)},${point.yPosition.toFixed(1)}`;
    })
    .join(" ");

const createChartTicks = (maxLossY: number): ChartTick[] => {
  const tickCount = Math.round(maxLossY / LOSS_STEP);
  return Array.from({ length: tickCount + 1 }, (_, index) => {
    const value = index * LOSS_STEP;
    return {
      isOptimal: value === 0,
      label: value === 0 ? "0.0 (Opt)" : value.toFixed(1),
      value,
      yPosition: calculateY(value, maxLossY),
    };
  });
};

export const formatShortLabel = (
  label: string,
  granularity: DiscardTrendGranularity,
): string => {
  if (granularity === "rolling20" || granularity === "rolling50") {
    return label
      .replace("Decisions ", "#")
      .replace("Retained decisions ", "Retained #")
      .replace("Skipped hands ", "Skipped #")
      .replace("Retained skipped hands ", "Retained skipped #");
  }
  return label;
};

export interface ChartXLabel {
  readonly anchor: "end" | "middle" | "start";
  readonly key: string;
  readonly label: string;
  readonly xPosition: number;
}

export interface PositionedLabel {
  readonly bucket: DiscardPeriodBucket;
  readonly label: string;
  readonly xPosition: number;
}

export const getLabelBounds = (
  label: string,
  xPosition: number,
  anchor: "end" | "middle" | "start",
): { readonly left: number; readonly right: number } => {
  const width = label.length * CHAR_WIDTH + LABEL_SAFETY_MARGIN;
  if (anchor === "start") {
    return { left: xPosition, right: xPosition + width };
  }
  if (anchor === "end") {
    return { left: xPosition - width, right: xPosition };
  }
  return {
    left: xPosition - width / HALF_DIVISOR,
    right: xPosition + width / HALF_DIVISOR,
  };
};

export const getXLabelAnchor = (
  xPosition: number,
  index: number,
  totalLabels: number,
): "end" | "middle" | "start" => {
  if (totalLabels <= 1) {
    return "middle";
  }
  if (index === 0 && xPosition <= MARGIN_LEFT + ENDPOINT_ANCHOR_THRESHOLD) {
    return "start";
  }
  if (
    index === totalLabels - 1 &&
    xPosition >= MARGIN_LEFT + PLOT_WIDTH - ENDPOINT_ANCHOR_THRESHOLD
  ) {
    return "end";
  }
  return "middle";
};

export const filterSpacedLabels = (
  positioned: readonly PositionedLabel[],
): PositionedLabel[] => {
  if (positioned.length <= 1) {
    return [...positioned];
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const first = positioned[0]!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const last = positioned.at(LAST_INDEX)!;

  const firstAnchor = getXLabelAnchor(first.xPosition, 0, positioned.length);
  const firstBounds = getLabelBounds(first.label, first.xPosition, firstAnchor);
  const lastAnchor = getXLabelAnchor(
    last.xPosition,
    positioned.length - 1,
    positioned.length,
  );
  const lastBounds = getLabelBounds(last.label, last.xPosition, lastAnchor);

  const chosen: PositionedLabel[] = [first];
  let lastChosenRight = firstBounds.right;

  for (let index = 1; index < positioned.length - 1; index += 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const candidate = positioned.at(index)!;
    const candidateBounds = getLabelBounds(
      candidate.label,
      candidate.xPosition,
      "middle",
    );
    if (
      candidateBounds.left >= lastChosenRight &&
      candidateBounds.right <= lastBounds.left
    ) {
      chosen.push(candidate);
      lastChosenRight = candidateBounds.right;
    }
  }

  if (lastBounds.left >= lastChosenRight) {
    chosen.push(last);
  }

  return chosen;
};

const createXAxisLabels = (
  buckets: readonly DiscardPeriodBucket[],
  granularity: DiscardTrendGranularity,
): readonly ChartXLabel[] => {
  const [single] = buckets;
  if (buckets.length === 1 && single) {
    return [
      {
        anchor: "middle",
        key: single.key,
        label: formatShortLabel(single.label, granularity),
        xPosition: calculateX({
          bucket: single,
          buckets,
          granularity,
          index: 0,
        }),
      },
    ];
  }

  const positioned: PositionedLabel[] = buckets.map((bucket, index) => ({
    bucket,
    label: formatShortLabel(bucket.label, granularity),
    xPosition: calculateX({ bucket, buckets, granularity, index }),
  }));

  const filtered = filterSpacedLabels(positioned);
  const total = filtered.length;

  return filtered.map(({ bucket, label, xPosition }, index) => ({
    anchor: getXLabelAnchor(xPosition, index, total),
    key: bucket.key,
    label,
    xPosition,
  }));
};

export const getLatestLoss = (points: readonly ChartPoint[]): string => {
  const lastPoint = points[points.length - 1];
  if (!lastPoint) {
    return "0.00";
  }
  return lastPoint.loss.toFixed(DECIMAL_PLACES);
};

export function DecisionQualityChart({
  buckets,
  granularity,
}: DecisionQualityChartProps): React.JSX.Element {
  const chartId = useId();
  const scoredBuckets = buckets.filter(
    (bucket) => bucket.meanExpectedPointsLoss !== null,
  );

  if (buckets.length === 0 || scoredBuckets.length === 0) {
    return (
      <div className={classes.empty}>
        No discard decisions recorded yet for this view.
      </div>
    );
  }

  const losses = scoredBuckets.map(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (bucket) => bucket.meanExpectedPointsLoss!,
  );
  const highestLoss = Math.max(...losses, MIN_MAX_LOSS);
  const maxLossY = Math.ceil(highestLoss / LOSS_STEP) * LOSS_STEP;
  const points = createChartPoints(buckets, granularity, maxLossY);
  const ticks = createChartTicks(maxLossY);
  const pathData = formatPathData(points);
  const latestLoss = getLatestLoss(points);
  const xLabels = createXAxisLabels(buckets, granularity);
  const latestScoredBucket = scoredBuckets[
    scoredBuckets.length - 1
  ] as DiscardPeriodBucket;
  const isLatestBucketScored =
    latestScoredBucket.key === buckets[buckets.length - 1]?.key;
  const latestDesc = isLatestBucketScored
    ? `Latest average expected loss is ${latestLoss} points.`
    : `Latest scored period (${latestScoredBucket.label}) average expected loss is ${latestLoss} points.`;

  return (
    <div className={classes.container}>
      <svg
        aria-describedby={`${chartId}-desc`}
        aria-label="Decision quality over time trend chart"
        className={classes.chart}
        role="img"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      >
        <desc id={`${chartId}-desc`}>
          {`Trend chart with ${buckets.length} periods. ${latestDesc}`}
        </desc>

        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              className={
                tick.isOptimal ? classes.optimalBaseline : classes.gridLine
              }
              x1={MARGIN_LEFT}
              x2={MARGIN_LEFT + PLOT_WIDTH}
              y1={tick.yPosition}
              y2={tick.yPosition}
            />
            <text
              className={classes.axisLabel}
              x={TICK_LABEL_X}
              y={tick.yPosition + TICK_OFFSET_Y}
            >
              {tick.label}
            </text>
          </g>
        ))}

        {points.length > 1 && (
          <path
            className={classes.trendLine}
            d={pathData}
          />
        )}

        {points.map((point) => (
          <circle
            className={classes.dataPoint}
            cx={point.xPosition}
            cy={point.yPosition}
            fill={point.color}
            key={point.bucket.key}
            r={POINT_RADIUS}
          >
            <title>
              {`${point.bucket.label}: ${point.bucket.meanExpectedPointsLoss?.toFixed(
                DECIMAL_PLACES,
              )} points loss (${point.bucket.decisions} decisions, ${
                point.bucket.optimalDecisions
              } optimal${
                point.bucket.skippedHands > 0
                  ? `, ${point.bucket.skippedHands} skipped`
                  : ""
              })`}
            </title>
          </circle>
        ))}

        {xLabels.map((xLabel) => (
          <text
            className={classes.xLabel}
            key={xLabel.key}
            textAnchor={xLabel.anchor}
            x={xLabel.xPosition}
            y={MARGIN_TOP + PLOT_HEIGHT + X_LABEL_OFFSET_Y}
          >
            {xLabel.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
