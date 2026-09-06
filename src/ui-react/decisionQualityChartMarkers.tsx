import * as classes from "./DecisionQualityChart.module.css";
import {
  DECIMAL_PLACES,
  MARGIN_TOP,
  PLOT_HEIGHT,
} from "./decisionQualityChartLayout";
import type { DiscardDecisionPoint } from "../ui/discardQualityTrend";
import React from "react";

// A band's edge sits at the midpoint between its mistake and the next one.
const MIDPOINT_DIVISOR = 2;

export interface LossEntry {
  readonly cx: number;
  readonly point: DiscardDecisionPoint;
}

export const lossPointTitle = (point: DiscardDecisionPoint): string => {
  const prefix = point.isRetained ? "Retained decision" : "Decision";
  return `${prefix} #${point.ordinal}: ${point.expectedPointsLoss.toFixed(
    DECIMAL_PLACES,
  )} points loss`;
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
  const dotClass =
    point.recencyAt === selectedRecencyAt
      ? `${classes.lossDot} ${classes.lossDotSelected}`
      : classes.lossDot;
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
        className={classes.lossStem}
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
