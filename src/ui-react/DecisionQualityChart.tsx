/* jscpd:ignore-start */
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
import React, { useCallback, useEffect, useId, useState } from "react";
import { SortOrder } from "../ui/SortOrder";
import { SortedCardLabels } from "./SortedCardLabels";
import { parseHand } from "../game/Card";
import { parseHandKey } from "../ui/handKey";
/* jscpd:ignore-end */

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

interface RollingPlotOptions {
  readonly granularity: DiscardTrendGranularity;
  readonly selectedTimestamp: number | null;
}

// The larger, invisible circle behind each loss dot, so a fingertip lands on it.
const LOSS_HIT_RADIUS = 7;

// A hit circle may span at most half the gap to the next marker, so dense targets never overlap.
const HIT_RADIUS_GAP_DIVISOR = 2;

function renderLossPoint(
  point: DiscardDecisionPoint,
  geometry: {
    readonly cx: number;
    readonly yStem: number;
    readonly yZero: number;
  },
  marker: {
    readonly hitRadius: number;
    readonly selectedTimestamp: number | null;
  },
): React.JSX.Element {
  const prefix = point.isRetained ? "Retained decision" : "Decision";
  const titleText = `${prefix} #${point.ordinal}: ${point.expectedPointsLoss.toFixed(
    DECIMAL_PLACES,
  )} points loss`;
  const dotClass =
    point.timestamp === marker.selectedTimestamp
      ? `${classes.lossDot} ${classes.lossDotSelected}`
      : classes.lossDot;
  return (
    <g
      aria-label={`${titleText}. Select to see the hand.`}
      className={classes.lossMarker}
      data-decision-ordinal={point.ordinal}
      data-decision-timestamp={point.timestamp}
      key={`decision-${point.ordinal}`}
      role="button"
      tabIndex={0}
    >
      <title>{titleText}</title>
      <line
        className={classes.lossStem}
        x1={geometry.cx}
        x2={geometry.cx}
        y1={geometry.yZero}
        y2={geometry.yStem}
      />
      <circle
        cx={geometry.cx}
        cy={geometry.yStem}
        fill="transparent"
        r={marker.hitRadius}
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

function renderRollingPlot(
  decisionPoints: readonly DiscardDecisionPoint[],
  maxLossY: number,
  { granularity, selectedTimestamp }: RollingPlotOptions,
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
  /*
   * The hit circle is capped at half the point spacing so dense charts (up
   * to MAX_RECENT_DECISIONS across PLOT_WIDTH) never stack overlapping
   * transparent targets, which would let a click on one marker resolve to
   * its neighbor painted on top.
   */
  const hitRadius =
    total > 1
      ? Math.min(
          LOSS_HIT_RADIUS,
          PLOT_WIDTH / (total - 1) / HIT_RADIUS_GAP_DIVISOR,
        )
      : LOSS_HIT_RADIUS;

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
          { hitRadius, selectedTimestamp },
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

const parsedHand = (
  handKey: string,
): {
  readonly cards: ReturnType<typeof parseHand>;
  readonly role: string | null;
} => {
  const parsed = parseHandKey(handKey);
  return { cards: parsed?.cards ?? [], role: parsed?.cribRole ?? null };
};

function renderDetailCards(
  label: string,
  cards: ReturnType<typeof parseHand>,
  keyPrefix: string,
): React.JSX.Element {
  return (
    <div className={classes.decisionDetailRow}>
      <span className={classes.decisionDetailLabel}>{label}</span>
      <span className={classes.decisionDetailCards}>
        <SortedCardLabels
          cards={cards}
          keyPrefix={keyPrefix}
          sortOrder={SortOrder.DealOrder}
        />
      </span>
    </div>
  );
}

function renderDecisionDetail(
  point: DiscardDecisionPoint,
  onClose: () => void,
): React.JSX.Element {
  const prefix = point.isRetained ? "Retained decision" : "Decision";
  const { cards, role } = parsedHand(point.handKey);
  return (
    <div
      aria-label={`${prefix} #${point.ordinal} detail`}
      className={classes.decisionDetail}
      role="region"
    >
      <div className={classes.decisionDetailHead}>
        <span className={classes.decisionDetailTitle}>
          {`${prefix} #${point.ordinal}`}
        </span>
        {role === null ? null : (
          <span className={classes.decisionDetailRole}>{role}</span>
        )}
        <span className={classes.decisionDetailLoss}>
          {`${point.expectedPointsLoss.toFixed(DECIMAL_PLACES)} lost`}
        </span>
        <button
          className={classes.detailClose}
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
      {renderDetailCards("Hand", cards, `chart-hand-${point.ordinal}`)}
      {point.discardKey === null
        ? null
        : renderDetailCards(
            "Discarded",
            parseHand(point.discardKey),
            `chart-discard-${point.ordinal}`,
          )}
    </div>
  );
}

/*
 * The tapped decision is held by its timestamp, a stable per-decision id,
 * not by chart ordinal: the crib-role filter renumbers the points under the
 * panel, so an ordinal would silently point it at a different hand. When the
 * selected decision leaves the filtered or granularity view, `find` misses
 * and the panel closes on its own.
 */
function useDecisionSelection(
  decisionPoints: readonly DiscardDecisionPoint[],
): {
  readonly handleChartActivate: (
    event: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  readonly handleCloseDetail: () => void;
  readonly selectedPoint: DiscardDecisionPoint | null;
} {
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(
    null,
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedTimestamp(null);
  }, []);

  const handleChartActivate = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      if (
        event.type === "keydown" &&
        (event as React.KeyboardEvent).key !== "Enter" &&
        (event as React.KeyboardEvent).key !== " "
      ) {
        return;
      }
      const marker = (event.target as Element).closest(
        "[data-decision-timestamp]",
      );
      if (!marker) {
        return;
      }
      event.preventDefault();
      const timestamp = Number(marker.getAttribute("data-decision-timestamp"));
      setSelectedTimestamp((current) =>
        current === timestamp ? null : timestamp,
      );
    },
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedTimestamp(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return {
    handleChartActivate,
    handleCloseDetail,
    selectedPoint:
      decisionPoints.find((point) => point.timestamp === selectedTimestamp) ??
      null,
  };
}

export function DecisionQualityChart({
  buckets,
  decisionPoints = EMPTY_DECISION_POINTS,
  granularity,
  totalDecisions,
}: DecisionQualityChartProps): React.JSX.Element {
  const chartId = useId();
  const { selectedPoint, handleChartActivate, handleCloseDetail } =
    useDecisionSelection(decisionPoints);

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
        onClick={handleChartActivate}
        onKeyDown={handleChartActivate}
        role="img"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      >
        <desc id={`${chartId}-desc`}>{chartDesc}</desc>

        {renderTicks(ticks)}

        {hasDecisionPoints
          ? renderRollingPlot(decisionPoints, maxLossY, {
              granularity,
              selectedTimestamp: selectedPoint?.timestamp ?? null,
            })
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
      {selectedPoint === null
        ? null
        : renderDecisionDetail(selectedPoint, handleCloseDetail)}
    </div>
  );
}

DecisionQualityChart.defaultProps = {
  decisionPoints: EMPTY_DECISION_POINTS,
  totalDecisions: null,
};
