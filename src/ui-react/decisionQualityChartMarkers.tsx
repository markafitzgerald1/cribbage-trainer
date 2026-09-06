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

/*
 * A row of transparent, edge-to-edge rectangles — one per mistake, each
 * spanning to the midpoint toward its neighbors — is the pointer hit area.
 * The per-marker approach could not survive a dense history: at the 100-point
 * cap the points sit ~4.5 viewBox units apart, so any circular target either
 * overlapped its neighbor (wrong hand on tap) or shrank below a fingertip.
 * Tiling bands give every mistake the widest catch area the spacing allows
 * and leave no dead pixels between them.
 */
export function renderHitBands(
  lossPoints: readonly LossEntry[],
  plotStart: number,
  plotEnd: number,
): React.JSX.Element {
  return (
    <g>
      {lossPoints.map((entry, index) => {
        const previous = index === 0 ? null : lossPoints[index - 1];
        const next =
          index === lossPoints.length - 1 ? null : lossPoints[index + 1];
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
          />
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
  const prefix = point.isRetained ? "Retained decision" : "Decision";
  const titleText = `${prefix} #${point.ordinal}: ${point.expectedPointsLoss.toFixed(
    DECIMAL_PLACES,
  )} points loss`;
  const dotClass =
    point.recencyAt === selectedRecencyAt
      ? `${classes.lossDot} ${classes.lossDotSelected}`
      : classes.lossDot;
  return (
    <g
      aria-label={`${titleText}. Select to see the hand.`}
      className={classes.lossMarker}
      data-decision-ordinal={point.ordinal}
      data-decision-recency={point.recencyAt}
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
        className={dotClass}
        cx={geometry.cx}
        cy={geometry.yStem}
        r={2}
      />
    </g>
  );
}
