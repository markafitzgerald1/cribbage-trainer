import * as classes from "./DecisionQualityChart.module.css";
import {
  type ChartPoint,
  type ChartTick,
  DECIMAL_PLACES,
  MARGIN_LEFT,
  MARGIN_TOP,
  MIN_MAX_LOSS,
  PLOT_HEIGHT,
  PLOT_WIDTH,
  POINT_RADIUS,
  SVG_HEIGHT,
  SVG_WIDTH,
  TICK_LABEL_X,
  TICK_OFFSET_Y,
  X_LABEL_OFFSET_Y,
  calculateIndexedX,
  calculateY,
  createAdaptiveChartTicks,
  createChartPoints,
  createRollingXAxisLabels,
  createXAxisLabels,
  formatPathData,
  getLatestLoss,
  getLossPointColor,
  getRollingWindowLabel,
} from "./decisionQualityChartLayout";
import type {
  DiscardDecisionPoint,
  DiscardPeriodBucket,
  DiscardTrendGranularity,
} from "../ui/discardQualityTrend";
import React, { useId } from "react";

export * from "./decisionQualityChartLayout";

const EMPTY_DECISION_POINTS: readonly DiscardDecisionPoint[] = [];

export interface DecisionQualityChartProps {
  readonly buckets: readonly DiscardPeriodBucket[];
  readonly decisionPoints?: readonly DiscardDecisionPoint[];
  readonly granularity: DiscardTrendGranularity;
  readonly totalDecisions?: number | null;
}

const renderTicks = (ticks: readonly ChartTick[]): React.JSX.Element[] =>
  ticks.map((tick) => (
    <g key={tick.value}>
      <line
        className={tick.isOptimal ? classes.optimalBaseline : classes.gridLine}
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
  ));

function renderRollingPlot(
  decisionPoints: readonly DiscardDecisionPoint[],
  maxLossY: number,
  granularity: DiscardTrendGranularity,
): React.JSX.Element {
  const total = decisionPoints.length;
  const movingPoints = decisionPoints.map((point, index) => ({
    color: getLossPointColor(point.rollingMeanLoss),
    loss: point.rollingMeanLoss,
    xPosition: calculateIndexedX(index, total),
    yPosition: calculateY(point.rollingMeanLoss, maxLossY),
  }));
  const movingPath = formatPathData(movingPoints);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const lastMovingPoint = movingPoints[movingPoints.length - 1]!;
  const latestLoss = lastMovingPoint.loss.toFixed(DECIMAL_PLACES);
  const windowLabel = getRollingWindowLabel(total, granularity);

  return (
    <>
      {decisionPoints.map((point, index) => {
        const xPosition = calculateIndexedX(index, total);
        const yStem = calculateY(point.expectedPointsLoss, maxLossY);
        const yZero = calculateY(0, maxLossY);
        const prefix = point.isRetained ? "Retained decision" : "Decision";
        if (point.isOptimal) {
          return (
            <circle
              className={classes.optimalDot}
              cx={xPosition}
              cy={yZero}
              key={`decision-${point.ordinal}`}
              r={1.5}
            >
              <title>{`${prefix} #${point.ordinal}: 0.00 points loss (optimal)`}</title>
            </circle>
          );
        }
        return (
          <g key={`decision-${point.ordinal}`}>
            <line
              className={classes.lossStem}
              x1={xPosition}
              x2={xPosition}
              y1={yZero}
              y2={yStem}
            />
            <circle
              className={classes.lossDot}
              cx={xPosition}
              cy={yStem}
              r={2}
            >
              <title>{`${prefix} #${point.ordinal}: ${point.expectedPointsLoss.toFixed(
                DECIMAL_PLACES,
              )} points loss`}</title>
            </circle>
          </g>
        );
      })}

      {movingPoints.length > 1 ? (
        <path
          className={classes.trendLine}
          d={movingPath}
        />
      ) : null}

      <circle
        className={classes.dataPoint}
        cx={lastMovingPoint.xPosition}
        cy={lastMovingPoint.yPosition}
        fill={lastMovingPoint.color}
        r={POINT_RADIUS}
      >
        <title>{`Latest ${windowLabel}: ${latestLoss} points loss`}</title>
      </circle>
    </>
  );
}

function renderCalendarPlot(points: readonly ChartPoint[]): React.JSX.Element {
  return (
    <>
      {points.length > 1 ? (
        <path
          className={classes.trendLine}
          d={formatPathData(points)}
        />
      ) : null}

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
    </>
  );
}

export function DecisionQualityChart({
  buckets,
  decisionPoints = EMPTY_DECISION_POINTS,
  granularity,
  totalDecisions,
}: DecisionQualityChartProps): React.JSX.Element {
  const chartId = useId();
  const isRolling = granularity === "rolling20" || granularity === "rolling50";
  const hasDecisionPoints = isRolling && decisionPoints.length > 0;
  const scoredBuckets = buckets.filter(
    (bucket) => bucket.meanExpectedPointsLoss !== null,
  );

  if (
    buckets.length === 0 ||
    (!hasDecisionPoints && scoredBuckets.length === 0)
  ) {
    return (
      <div className={classes.empty}>
        No discard decisions recorded yet for this view.
      </div>
    );
  }

  const allLosses = hasDecisionPoints
    ? decisionPoints.map((point) =>
        Math.max(point.expectedPointsLoss, point.rollingMeanLoss),
      )
    : scoredBuckets.map(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (bucket) => bucket.meanExpectedPointsLoss!,
      );
  const highestLoss = Math.max(...allLosses, MIN_MAX_LOSS);
  const { maxLossY, ticks } = createAdaptiveChartTicks(highestLoss);
  const calendarPoints = createChartPoints(buckets, granularity, maxLossY);
  const xLabels = hasDecisionPoints
    ? createRollingXAxisLabels(decisionPoints)
    : createXAxisLabels(buckets, granularity);

  const latestLoss = hasDecisionPoints
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      decisionPoints[decisionPoints.length - 1]!.rollingMeanLoss.toFixed(
        DECIMAL_PLACES,
      )
    : getLatestLoss(calendarPoints);

  const latestScoredBucket = scoredBuckets[
    scoredBuckets.length - 1
  ] as DiscardPeriodBucket;
  const isLatestBucketScored =
    latestScoredBucket.key === buckets[buckets.length - 1]?.key;
  const calendarDesc = isLatestBucketScored
    ? `Latest average expected loss is ${latestLoss} points.`
    : `Latest scored period (${latestScoredBucket.label}) average expected loss is ${latestLoss} points.`;

  const rollingWindowLabel = getRollingWindowLabel(
    decisionPoints.length,
    granularity,
  );
  const decisionCountText =
    typeof totalDecisions === "number" && totalDecisions > decisionPoints.length
      ? `the most recent ${decisionPoints.length} of ${totalDecisions}`
      : `${decisionPoints.length}`;
  const chartDesc = hasDecisionPoints
    ? `Trend chart with ${decisionCountText} decisions (${rollingWindowLabel}). Latest average expected loss is ${latestLoss} points.`
    : `Trend chart with ${buckets.length} periods. ${calendarDesc}`;

  return (
    <div className={classes.container}>
      <svg
        aria-describedby={`${chartId}-desc`}
        aria-label="Decision quality over time trend chart"
        className={classes.chart}
        role="img"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      >
        <desc id={`${chartId}-desc`}>{chartDesc}</desc>

        {renderTicks(ticks)}

        {hasDecisionPoints
          ? renderRollingPlot(decisionPoints, maxLossY, granularity)
          : renderCalendarPlot(calendarPoints)}

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

DecisionQualityChart.defaultProps = {
  decisionPoints: EMPTY_DECISION_POINTS,
  totalDecisions: null,
};
