/* jscpd:ignore-start */
import * as classes from "./DecisionQualityChart.module.css";
import {
  DECIMAL_PLACES,
  MARGIN_TOP,
  MIN_MAX_LOSS,
  PLOT_HEIGHT,
  SVG_HEIGHT,
  SVG_WIDTH,
  X_LABEL_OFFSET_Y,
  createAdaptiveChartTicks,
  createChartPoints,
  createRollingXAxisLabels,
  createXAxisLabels,
  getLatestLoss,
} from "./decisionQualityChartLayout";
import type {
  DiscardDecisionPoint,
  DiscardPeriodBucket,
  DiscardTrendGranularity,
} from "../ui/discardQualityTrend";
import React, { useCallback, useEffect, useId, useState } from "react";
import {
  buildChartDescription,
  renderCalendarPlot,
  renderRollingPlot,
  renderTicks,
} from "./decisionQualityChartMarkers";
import { SortOrder } from "../ui/SortOrder";
import { SortedCardLabels } from "./SortedCardLabels";
import { parseHand } from "../game/Card";
import { parseHandKey } from "../ui/handKey";
/* jscpd:ignore-end */

export * from "./decisionQualityChartLayout";

const EMPTY_DECISION_POINTS: readonly DiscardDecisionPoint[] = [];

export type PracticeDecisionHandler =
  ((point: DiscardDecisionPoint) => void) | null;

export interface DecisionQualityChartProps {
  readonly buckets: readonly DiscardPeriodBucket[];
  readonly decisionPoints?: readonly DiscardDecisionPoint[];
  readonly granularity: DiscardTrendGranularity;
  // Starts a drill on the tapped mistake's hand; null hides the detail panel's practice button.
  readonly onPracticeDecision?: PracticeDecisionHandler;
  // The card order the rest of the app is using, so the detail panel's cards match the board.
  readonly sortOrder?: SortOrder;
  readonly totalDecisions?: number | null;
}

// The data attribute both the tiling hit bands and the keyboard markers carry.
const DECISION_HIT_SELECTOR = "[data-decision-recency]";

const parsedHand = (
  handKey: string,
): {
  readonly cards: ReturnType<typeof parseHand>;
  readonly role: string | null;
} => {
  const parsed = parseHandKey(handKey);
  return { cards: parsed?.cards ?? [], role: parsed?.cribRole ?? null };
};

interface DetailCardsRow {
  readonly cards: ReturnType<typeof parseHand>;
  readonly keyPrefix: string;
  readonly label: string;
  readonly sortOrder: SortOrder;
}

function renderDetailCards({
  cards,
  keyPrefix,
  label,
  sortOrder,
}: DetailCardsRow): React.JSX.Element {
  return (
    <div className={classes.decisionDetailRow}>
      <span className={classes.decisionDetailLabel}>{label}</span>
      <span className={classes.decisionDetailCards}>
        <SortedCardLabels
          cards={cards}
          keyPrefix={keyPrefix}
          sortOrder={sortOrder}
        />
      </span>
    </div>
  );
}

interface DecisionDetailHandlers {
  readonly onClose: () => void;
  readonly onPractice: (() => void) | null;
  readonly sortOrder: SortOrder;
}

function renderDecisionDetail(
  point: DiscardDecisionPoint,
  { onClose, onPractice, sortOrder }: DecisionDetailHandlers,
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
      {renderDetailCards({
        cards,
        keyPrefix: `chart-hand-${point.ordinal}`,
        label: "Hand",
        sortOrder,
      })}
      {point.discardKey === null
        ? null
        : renderDetailCards({
            cards: parseHand(point.discardKey),
            keyPrefix: `chart-discard-${point.ordinal}`,
            label: "Discarded",
            sortOrder,
          })}
      {onPractice === null ? null : (
        <div className={classes.decisionDetailActions}>
          <button
            className={classes.decisionDetailPractice}
            onClick={onPractice}
            type="button"
          >
            Practice this hand
          </button>
        </div>
      )}
    </div>
  );
}

/*
 * The tapped decision is held by its recencyAt, a stable per-decision id
 * (normalizeStoredRecords forces it strictly increasing): the crib-role
 * filter renumbers `ordinal` and a rolled-back clock can repeat `at`, so
 * either would silently point the panel at a different hand. When the
 * selected decision leaves the filtered or granularity view, `find` misses
 * and the panel closes on its own.
 */
function useDecisionSelection(
  decisionPoints: readonly DiscardDecisionPoint[],
  onPracticeDecision: PracticeDecisionHandler,
): {
  readonly handleChartActivate: (
    event: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  readonly handleCloseDetail: () => void;
  readonly handlePracticeSelected: (() => void) | null;
  readonly selectedPoint: DiscardDecisionPoint | null;
} {
  const [selectedRecencyAt, setSelectedRecencyAt] = useState<number | null>(
    null,
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedRecencyAt(null);
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
      const marker = (event.target as Element).closest(DECISION_HIT_SELECTOR);
      if (!marker) {
        return;
      }
      event.preventDefault();
      const recencyAt = Number(marker.getAttribute("data-decision-recency"));
      setSelectedRecencyAt((current) =>
        current === recencyAt ? null : recencyAt,
      );
    },
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedRecencyAt(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const selectedPoint =
    decisionPoints.find((point) => point.recencyAt === selectedRecencyAt) ??
    null;
  /*
   * When a role or granularity filter drops the selected decision, forget it
   * outright rather than only deriving `null`: otherwise restoring the filter
   * silently reopens the panel on a decision the user had navigated away
   * from. The render-time reset mirrors usePracticeDrill's.
   */
  if (selectedRecencyAt !== null && selectedPoint === null) {
    setSelectedRecencyAt(null);
  }

  const handlePracticeSelected =
    onPracticeDecision === null || selectedPoint === null
      ? null
      : () => {
          onPracticeDecision(selectedPoint);
        };

  return {
    handleChartActivate,
    handleCloseDetail,
    handlePracticeSelected,
    selectedPoint,
  };
}

export function DecisionQualityChart({
  buckets,
  decisionPoints = EMPTY_DECISION_POINTS,
  granularity,
  onPracticeDecision = null,
  sortOrder = SortOrder.DealOrder,
  totalDecisions,
}: DecisionQualityChartProps): React.JSX.Element {
  const chartId = useId();
  const {
    selectedPoint,
    handleChartActivate,
    handleCloseDetail,
    handlePracticeSelected,
  } = useDecisionSelection(decisionPoints, onPracticeDecision);

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

  const chartDesc = buildChartDescription({
    buckets,
    decisionPoints,
    granularity,
    hasDecisionPoints,
    latestLoss,
    scoredBuckets,
    totalDecisions,
  });

  return (
    <div className={classes.container}>
      <svg
        aria-describedby={`${chartId}-desc`}
        aria-label="Decision quality over time trend chart"
        className={classes.chart}
        onClick={handleChartActivate}
        onKeyDown={handleChartActivate}
        // Not role="img": a screen reader then ignores everything inside, including the marker buttons that take focus.
        role="group"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      >
        <desc id={`${chartId}-desc`}>{chartDesc}</desc>

        {renderTicks(ticks)}

        {hasDecisionPoints
          ? renderRollingPlot(decisionPoints, maxLossY, {
              granularity,
              selectedRecencyAt: selectedPoint?.recencyAt ?? null,
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
        : renderDecisionDetail(selectedPoint, {
            onClose: handleCloseDetail,
            onPractice: handlePracticeSelected,
            sortOrder,
          })}
    </div>
  );
}

DecisionQualityChart.defaultProps = {
  decisionPoints: EMPTY_DECISION_POINTS,
  onPracticeDecision: null,
  sortOrder: SortOrder.DealOrder,
  totalDecisions: null,
};
