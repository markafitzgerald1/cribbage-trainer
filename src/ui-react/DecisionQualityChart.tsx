import * as classes from "./DecisionQualityChart.module.css";
import {
  type DiscardPeriodBucket,
  type DiscardTrendGranularity,
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
const LOSS_TIER_QUARTER = 0.25;
const LOSS_TIER_HALF = 0.5;
const LOSS_TIER_ONE = 1.0;
const SMALL_BUCKET_COUNT = 6;
const MEDIUM_BUCKET_COUNT = 12;
const HALF_DIVISOR = 2;
const TICK_OFFSET_X = 6;
const TICK_OFFSET_Y = 3.5;
const X_LABEL_OFFSET_Y = 22;
const DECIMAL_PLACES = 2;
const TICK_LABEL_X = MARGIN_LEFT - TICK_OFFSET_X;
const POINT_RADIUS = 4.5;
const LAST_INDEX = -1;

export const getLossColor = (loss: number | null): string => {
  if (loss === null) {
    return "#888888";
  }
  if (loss <= 0) {
    return "#28a745";
  }
  if (loss <= LOSS_TIER_QUARTER) {
    return "#70c878";
  }
  if (loss <= LOSS_TIER_HALF) {
    return "#f0ad4e";
  }
  if (loss <= LOSS_TIER_ONE) {
    return "#e67e22";
  }
  return "#d9534f";
};

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
        color: getLossColor(bucket.meanExpectedPointsLoss),
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

const shouldDisplayXLabel = (
  index: number,
  total: number,
  granularity: DiscardTrendGranularity,
): boolean => {
  const isEndpointOrMidpoint =
    index === 0 ||
    index === Math.floor(total / HALF_DIVISOR) ||
    index === total - 1;

  if (granularity === "week") {
    return isEndpointOrMidpoint;
  }
  if (total <= SMALL_BUCKET_COUNT) {
    return true;
  }
  if (total <= MEDIUM_BUCKET_COUNT) {
    return index % HALF_DIVISOR === 0 || index === total - 1;
  }
  return isEndpointOrMidpoint;
};

const formatShortLabel = (
  label: string,
  granularity: DiscardTrendGranularity,
): string => {
  if (granularity === "rolling20" || granularity === "rolling50") {
    return label
      .replace("Decisions ", "#")
      .replace("Retained decisions ", "Retained #");
  }
  return label;
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
          {`Trend chart with ${buckets.length} periods. Latest average expected loss is ${latestLoss} points.`}
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
            tabIndex={0}
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

        {buckets.map((bucket, index) => {
          if (!shouldDisplayXLabel(index, buckets.length, granularity)) {
            return null;
          }
          const xPosition = calculateX({ bucket, buckets, granularity, index });
          return (
            <text
              className={classes.xLabel}
              key={bucket.key}
              x={xPosition}
              y={MARGIN_TOP + PLOT_HEIGHT + X_LABEL_OFFSET_Y}
            >
              {formatShortLabel(bucket.label, granularity)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
