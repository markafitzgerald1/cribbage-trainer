import * as classes from "./DecisionQualityChart.module.css";
import {
  type ChartPoint,
  type ChartTick,
  DECIMAL_PLACES,
  MARGIN_LEFT,
  MARGIN_TOP,
  PLOT_HEIGHT,
  PLOT_WIDTH,
  POINT_RADIUS,
  TICK_LABEL_X,
  TICK_OFFSET_Y,
  calculateIndexedX,
  calculateY,
  formatPathData,
  getLossPointColor,
  getRollingWindowLabel,
} from "./decisionQualityChartLayout";
import type {
  DiscardDecisionPoint,
  DiscardPeriodBucket,
  DiscardTrendGranularity,
} from "../ui/discardQualityTrend";
import React from "react";

// A band's edge sits at the midpoint between its mistake and the next one.
const MIDPOINT_DIVISOR = 2;

export interface LossEntry {
  readonly cx: number;
  readonly point: DiscardDecisionPoint;
}

export const lossPointTitle = (point: DiscardDecisionPoint): string => {
  const prefix = point.isRetained ? "Retained decision" : "Decision";
  const mastered = point.isMastered ? ", mastered since" : "";
  return `${prefix} #${point.ordinal}: ${point.expectedPointsLoss.toFixed(
    DECIMAL_PLACES,
  )} points loss${mastered}`;
};

/*
 * The pointer hit area is a row of transparent rectangles, painted last so
 * the trend path and the latest-average dot — otherwise on top — cannot
 * swallow a tap. Each mistake owns the strip from the midpoint to its
 * previous decision to the midpoint to its next, so it gets the widest
 * catch area the spacing allows; the strips over *optimal* decisions carry
 * no rectangle, so tapping a green point does nothing rather than opening a
 * neighboring mistake. The per-marker circle this replaced could not
 * survive the 100-point cap: points ~4.5 viewBox units apart forced any
 * circular target to either overlap its neighbor or shrink below a
 * fingertip. Each band carries the marker's own hover title.
 */
export function renderHitBands(
  entries: readonly LossEntry[],
  plotStart: number,
  plotEnd: number,
): React.JSX.Element {
  return (
    <g>
      {entries.map((entry, index) => {
        if (entry.point.isOptimal) {
          return null;
        }
        const previous = index === 0 ? null : entries[index - 1];
        const next = index === entries.length - 1 ? null : entries[index + 1];
        const left = previous
          ? (previous.cx + entry.cx) / MIDPOINT_DIVISOR
          : plotStart;
        const right = next ? (entry.cx + next.cx) / MIDPOINT_DIVISOR : plotEnd;
        return (
          <rect
            className={classes.lossHitBand}
            data-decision-ordinal={entry.point.ordinal}
            data-decision-recency={entry.point.recencyAt}
            fill="transparent"
            height={PLOT_HEIGHT}
            key={`hit-${entry.point.ordinal}`}
            width={right - left}
            x={left}
            y={MARGIN_TOP}
          >
            <title>{lossPointTitle(entry.point)}</title>
          </rect>
        );
      })}
    </g>
  );
}

export function renderLossPoint(
  point: DiscardDecisionPoint,
  geometry: {
    readonly cx: number;
    readonly yStem: number;
    readonly yZero: number;
  },
  selectedRecencyAt: number | null,
): React.JSX.Element {
  const baseDotClass = point.isMastered
    ? `${classes.lossDot} ${classes.lossDotMastered}`
    : classes.lossDot;
  const dotClass =
    point.recencyAt === selectedRecencyAt
      ? `${baseDotClass} ${classes.lossDotSelected}`
      : baseDotClass;
  const stemClass = point.isMastered
    ? `${classes.lossStem} ${classes.lossStemMastered}`
    : classes.lossStem;
  return (
    <g
      // The hover title lives on the hit band that covers this marker; here it would only duplicate it.
      aria-label={`${lossPointTitle(point)}. Select to see the hand.`}
      className={classes.lossMarker}
      data-decision-ordinal={point.ordinal}
      data-decision-recency={point.recencyAt}
      key={`decision-${point.ordinal}`}
      role="button"
      tabIndex={0}
    >
      <line
        className={stemClass}
        x1={geometry.cx}
        x2={geometry.cx}
        y1={geometry.yZero}
        y2={geometry.yStem}
      />
      <circle
        className={dotClass}
        cx={geometry.cx}
        cy={geometry.yStem}
        r={2}
      />
    </g>
  );
}

export const renderTicks = (ticks: readonly ChartTick[]): React.JSX.Element[] =>
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

export interface RollingPlotOptions {
  readonly granularity: DiscardTrendGranularity;
  readonly selectedRecencyAt: number | null;
}

export function renderRollingPlot(
  decisionPoints: readonly DiscardDecisionPoint[],
  maxLossY: number,
  { granularity, selectedRecencyAt }: RollingPlotOptions,
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
  const decisionEntries = decisionPoints.map((point, index) => ({
    cx: calculateIndexedX(index, total),
    point,
  }));
  const hasMistake = decisionPoints.some((point) => !point.isOptimal);

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
        return renderLossPoint(
          point,
          { cx: xPosition, yStem, yZero },
          selectedRecencyAt,
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

      {hasMistake
        ? renderHitBands(decisionEntries, MARGIN_LEFT, MARGIN_LEFT + PLOT_WIDTH)
        : null}
    </>
  );
}

export function renderCalendarPlot(
  points: readonly ChartPoint[],
): React.JSX.Element {
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

interface ChartDescriptionInput {
  readonly buckets: readonly DiscardPeriodBucket[];
  readonly decisionPoints: readonly DiscardDecisionPoint[];
  readonly granularity: DiscardTrendGranularity;
  readonly hasDecisionPoints: boolean;
  readonly latestLoss: string;
  readonly scoredBuckets: readonly DiscardPeriodBucket[];
  readonly totalDecisions: number | null | undefined;
}

export const buildChartDescription = ({
  buckets,
  decisionPoints,
  granularity,
  hasDecisionPoints,
  latestLoss,
  scoredBuckets,
  totalDecisions,
}: ChartDescriptionInput): string => {
  if (hasDecisionPoints) {
    const windowLabel = getRollingWindowLabel(
      decisionPoints.length,
      granularity,
    );
    const countText =
      typeof totalDecisions === "number" &&
      totalDecisions > decisionPoints.length
        ? `the most recent ${decisionPoints.length} of ${totalDecisions}`
        : `${decisionPoints.length}`;
    return `Trend chart with ${countText} decisions (${windowLabel}). Latest average expected loss is ${latestLoss} points.`;
  }
  const latestScoredBucket = scoredBuckets[
    scoredBuckets.length - 1
  ] as DiscardPeriodBucket;
  const calendarDesc =
    latestScoredBucket.key === buckets[buckets.length - 1]?.key
      ? `Latest average expected loss is ${latestLoss} points.`
      : `Latest scored period (${latestScoredBucket.label}) average expected loss is ${latestLoss} points.`;
  return `Trend chart with ${buckets.length} periods. ${calendarDesc}`;
};
