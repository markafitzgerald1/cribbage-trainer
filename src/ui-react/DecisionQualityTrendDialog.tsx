/* jscpd:ignore-start */
import * as classes from "./DecisionQualityTrendDialog.module.css";
import {
  type CribRoleFilter,
  type DiscardDecisionPoint,
  type DiscardPeriodBucket,
  type DiscardTrendGranularity,
  MAX_RECENT_DECISIONS,
  computeDiscardQualityTrend,
} from "../ui/discardQualityTrend";
import { DIALOG_ROLE_OPTIONS, DialogFilterGroup } from "./DialogFilterGroup";
import {
  DecisionQualityChart,
  type PracticeDecisionHandler,
} from "./DecisionQualityChart";
import {
  MAX_RECORDS,
  type StoredTally,
  readTallyForDisplay,
} from "../ui/discardTally";
import { useCallback, useMemo, useState } from "react";
import { DialogSummaryCards } from "./DialogSummaryCards";
import Modal from "./Modal";
import { SortOrder } from "../ui/SortOrder";
import type { StartDrillHandler } from "./usePracticeDrill";
import { buildMistakeQueue } from "../ui/mistakeQueue";
import { useCloseOnEscape } from "./useCloseOnEscape";
/* jscpd:ignore-end */

export interface DecisionQualityTrendDialogProps {
  readonly initialGranularity?: DiscardTrendGranularity;
  readonly initialRoleFilter?: CribRoleFilter;
  readonly onClose: () => void;
  // Starts a drill on a chart mistake's hand; null hides the detail panel's practice button.
  readonly onStartDrill?: StartDrillHandler;
  readonly show: boolean;
  // The card order the rest of the app uses, so the detail panel matches the board.
  readonly sortOrder?: SortOrder;
  readonly tally?: StoredTally | null;
}

const GRANULARITY_OPTIONS: {
  readonly label: string;
  readonly value: DiscardTrendGranularity;
}[] = [
  { label: "Rolling 20", value: "rolling20" },
  { label: "Rolling 50", value: "rolling50" },
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

const PER_CENT = 100;
const DECIMAL_PLACES = 2;
const PERCENT_DECIMAL_PLACES = 1;

const formatSkipRate = (decisions: number, skipped: number): string => {
  const handsFaced = decisions + skipped;
  return handsFaced === 0
    ? "—"
    : `${((skipped / handsFaced) * PER_CENT).toFixed(PERCENT_DECIMAL_PLACES)}%`;
};

const formatSkippedHands = (decisions: number, skipped: number): string =>
  `${skipped} (${formatSkipRate(decisions, skipped)})`;

const getLossPillClass = (loss: number | null): string => {
  if (loss === null) {
    return classes.lossPillNone;
  }
  if (loss === 0) {
    return classes.lossPillOptimal;
  }
  return "";
};

function renderBucketRow(bucket: DiscardPeriodBucket): React.JSX.Element {
  const avgLoss =
    bucket.meanExpectedPointsLoss === null
      ? "—"
      : bucket.meanExpectedPointsLoss.toFixed(DECIMAL_PLACES);
  const optimalPct =
    bucket.decisions > 0
      ? `${((bucket.optimalDecisions / bucket.decisions) * PER_CENT).toFixed(
          PERCENT_DECIMAL_PLACES,
        )}%`
      : "—";

  return (
    <tr key={bucket.key}>
      <td>{bucket.label}</td>
      <td>{bucket.decisions}</td>
      <td>
        <span
          className={`${classes.lossPill} ${getLossPillClass(bucket.meanExpectedPointsLoss)}`}
        >
          {avgLoss}
        </span>
      </td>
      <td>{optimalPct}</td>
      <td>{formatSkippedHands(bucket.decisions, bucket.skippedHands)}</td>
    </tr>
  );
}

function renderBreakdownTable(
  buckets: readonly DiscardPeriodBucket[],
): React.JSX.Element {
  return (
    <div className={classes.tableWrapper}>
      <table className={classes.table}>
        <thead>
          <tr>
            <th>Period / Batch</th>
            <th>Decisions</th>
            <th>Avg loss</th>
            <th>Optimal</th>
            <th>Skipped (rate)</th>
          </tr>
        </thead>
        <tbody>{buckets.map(renderBucketRow)}</tbody>
      </table>
    </div>
  );
}

export function DecisionQualityTrendDialog({
  initialGranularity = "rolling20",
  initialRoleFilter = "all",
  onClose,
  onStartDrill = null,
  show,
  sortOrder = SortOrder.DealOrder,
  tally = null,
}: DecisionQualityTrendDialogProps): React.JSX.Element | null {
  const [granularity, setGranularity] =
    useState<DiscardTrendGranularity>(initialGranularity);
  const [roleFilter, setRoleFilter] =
    useState<CribRoleFilter>(initialRoleFilter);

  useCloseOnEscape(show, onClose);

  /*
   * Null unless a drill can be started, so the chart hides its practice
   * button rather than rendering a dead one. The queue is rebuilt on click,
   * not every render: a tapped chart mistake resolves to its whole
   * MistakeQueueItem (the drill needs more than the hand key), and the
   * current tally is the freshest source for that.
   */
  const startDrillOnDecision = useMemo<PracticeDecisionHandler>(
    () =>
      onStartDrill === null
        ? null
        : (point: DiscardDecisionPoint) => {
            const item = buildMistakeQueue(tally ?? readTallyForDisplay()).find(
              (queueItem) => queueItem.handKey === point.handKey,
            );
            // A MistakeQueueItem is always an object, so a plain truthy check is safe.
            if (item) {
              onStartDrill(item);
            }
          },
    [onStartDrill, tally],
  );

  const changeGranularity = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setGranularity(event.currentTarget.value as DiscardTrendGranularity);
    },
    [],
  );

  const changeRoleFilter = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRoleFilter(event.currentTarget.value as CribRoleFilter);
    },
    [],
  );

  if (!show) {
    return null;
  }

  const sourceTally = tally ?? readTallyForDisplay();
  const trend = computeDiscardQualityTrend(sourceTally, {
    granularity,
    roleFilter,
  });

  const totalDecisions = trend.totalAuthenticDecisions;
  const optimalDecisions = trend.buckets.reduce(
    (sum, bucket) => sum + bucket.optimalDecisions,
    0,
  );
  const totalLoss = trend.buckets.reduce(
    (sum, bucket) =>
      sum + (bucket.meanExpectedPointsLoss ?? 0) * bucket.decisions,
    0,
  );
  const overallAvgLoss =
    totalDecisions > 0
      ? (totalLoss / totalDecisions).toFixed(DECIMAL_PLACES)
      : "—";
  const overallOptimalRate =
    totalDecisions > 0
      ? `${((optimalDecisions / totalDecisions) * PER_CENT).toFixed(
          PERCENT_DECIMAL_PLACES,
        )}%`
      : "—";

  const isRolling = granularity === "rolling20" || granularity === "rolling50";

  return (
    <Modal
      onClose={onClose}
      show={show}
    >
      <section
        aria-label="Decision quality over time"
        className={classes.dialog}
      >
        <h2 className={classes.title}>Decision quality over time</h2>
        <div className={classes.controls}>
          <DialogFilterGroup
            classes={classes}
            currentValue={granularity}
            groupName="trend-granularity"
            legendText="Granularity"
            onChange={changeGranularity}
            options={GRANULARITY_OPTIONS}
          />
          <DialogFilterGroup
            classes={classes}
            currentValue={roleFilter}
            groupName="trend-role-filter"
            legendText="Crib role"
            onChange={changeRoleFilter}
            options={DIALOG_ROLE_OPTIONS}
          />
        </div>

        {trend.isAtRecordCap ? (
          <div
            className={classes.horizonNotice}
            role="status"
          >
            Decision and skipped-hand history each retain up to{" "}
            {MAX_RECORDS.toLocaleString("en-US")} entries. This view may not
            include earlier play.
          </div>
        ) : null}

        <p className={classes.methodology}>
          Average loss is the expected points left on the table by your first
          discard, so lower is better. Rolling batches smooth small-sample
          swings; use each calendar period&apos;s decision count to judge its
          signal.
        </p>

        {isRolling && totalDecisions > MAX_RECENT_DECISIONS ? (
          <p className={classes.methodology}>
            The rolling chart displays the most recent {MAX_RECENT_DECISIONS}{" "}
            decisions with their trailing moving average.
          </p>
        ) : null}

        {roleFilter === "all" ? null : (
          <p className={classes.methodology}>
            Skipped hands are not assigned a crib role, so they are excluded
            from this filtered view.
          </p>
        )}

        <DialogSummaryCards
          classes={classes}
          metrics={[
            { label: "Decisions", value: totalDecisions },
            { label: "Avg loss", value: overallAvgLoss },
            { label: "Best choice", value: overallOptimalRate },
            {
              label: "Skipped",
              value: formatSkippedHands(
                totalDecisions,
                trend.totalSkippedHands,
              ),
            },
          ]}
        />

        <DecisionQualityChart
          buckets={trend.buckets}
          decisionPoints={trend.decisionPoints}
          granularity={granularity}
          onPracticeDecision={startDrillOnDecision}
          sortOrder={sortOrder}
          totalDecisions={totalDecisions}
        />

        {renderBreakdownTable(trend.buckets)}
      </section>
    </Modal>
  );
}

DecisionQualityTrendDialog.defaultProps = {
  initialGranularity: "rolling20",
  initialRoleFilter: "all",
  onStartDrill: null,
  sortOrder: SortOrder.DealOrder,
  tally: null,
};
