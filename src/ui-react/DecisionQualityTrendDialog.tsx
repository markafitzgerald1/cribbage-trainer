import * as classes from "./DecisionQualityTrendDialog.module.css";
import {
  type CribRoleFilter,
  type DiscardPeriodBucket,
  type DiscardTrendGranularity,
  HALF_POINT,
  ONE_POINT,
  QUARTER_POINT,
  computeDiscardQualityTrend,
} from "../ui/discardQualityTrend";
import { type StoredTally, readTallyForDisplay } from "../ui/discardTally";
import { useCallback, useState } from "react";
import { DecisionQualityChart } from "./DecisionQualityChart";
import Modal from "./Modal";
import { useCloseOnEscape } from "./useCloseOnEscape";

export interface DecisionQualityTrendDialogProps {
  readonly initialGranularity?: DiscardTrendGranularity;
  readonly initialRoleFilter?: CribRoleFilter;
  readonly onClose: () => void;
  readonly show: boolean;
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

const ROLE_OPTIONS: {
  readonly label: string;
  readonly value: CribRoleFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Dealer", value: "dealer" },
  { label: "Pone", value: "pone" },
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
  if (loss <= 0) {
    return classes.lossPillOptimal;
  }
  if (loss <= QUARTER_POINT) {
    return classes.lossPillMinor;
  }
  if (loss <= HALF_POINT) {
    return classes.lossPillInside;
  }
  if (loss <= ONE_POINT) {
    return classes.lossPillOpen;
  }
  return classes.lossPillBlunder;
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
      <td>
        <div className={classes.severityCounts}>
          <span
            className={`${classes.severityBadge} ${classes.badgeOptimal}`}
            title="Optimal (0.00)"
          >
            {bucket.severity.optimal}
          </span>
          <span
            className={`${classes.severityBadge} ${classes.badgeMinor}`}
            title="> 0 and ≤ 0.25 points"
          >
            {bucket.severity.upToQuarter}
          </span>
          <span
            className={`${classes.severityBadge} ${classes.badgeInside}`}
            title="> 0.25 and ≤ 0.50 points"
          >
            {bucket.severity.quarterToHalf}
          </span>
          <span
            className={`${classes.severityBadge} ${classes.badgeOpen}`}
            title="> 0.50 and ≤ 1.00 points"
          >
            {bucket.severity.halfToOne}
          </span>
          <span
            className={`${classes.severityBadge} ${classes.badgeBlunder}`}
            title="> 1.00 points"
          >
            {bucket.severity.overOne}
          </span>
        </div>
      </td>
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
            <th>Severity distribution</th>
          </tr>
        </thead>
        <tbody>{buckets.map(renderBucketRow)}</tbody>
      </table>
    </div>
  );
}

function renderSummaryCards(options: {
  readonly avgLoss: string;
  readonly decisions: number;
  readonly optimalRate: string;
  readonly skipped: number | string;
}): React.JSX.Element {
  const metrics: { readonly label: string; readonly value: number | string }[] =
    [
      { label: "Decisions", value: options.decisions },
      { label: "Avg loss", value: options.avgLoss },
      { label: "Best choice", value: options.optimalRate },
      { label: "Skipped", value: options.skipped },
    ];

  return (
    <div className={classes.summaryCards}>
      {metrics.map((metric) => (
        <div
          className={classes.summaryCard}
          key={metric.label}
        >
          <span className={classes.summaryLabel}>{metric.label}</span>
          <span className={classes.summaryValue}>{metric.value}</span>
        </div>
      ))}
    </div>
  );
}

interface FilterGroupProps<T extends string> {
  readonly currentValue: T;
  readonly groupName: string;
  readonly legendText: string;
  readonly onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly options: readonly { readonly label: string; readonly value: T }[];
}

function renderFilterGroup<T extends string>({
  currentValue,
  groupName,
  legendText,
  onChange,
  options,
}: FilterGroupProps<T>): React.JSX.Element {
  return (
    <fieldset className={classes.filterGroup}>
      <legend>{legendText}</legend>
      {options.map((option) => {
        const id = `${groupName}-${option.value}`;
        return (
          <span key={option.value}>
            <input
              checked={currentValue === option.value}
              className={classes.input}
              id={id}
              name={groupName}
              onChange={onChange}
              type="radio"
              value={option.value}
            />
            <label
              className={classes.option}
              htmlFor={id}
            >
              {option.label}
            </label>
          </span>
        );
      })}
    </fieldset>
  );
}

export function DecisionQualityTrendDialog({
  initialGranularity = "rolling20",
  initialRoleFilter = "all",
  onClose,
  show,
  tally = null,
}: DecisionQualityTrendDialogProps): React.JSX.Element | null {
  const [granularity, setGranularity] =
    useState<DiscardTrendGranularity>(initialGranularity);
  const [roleFilter, setRoleFilter] =
    useState<CribRoleFilter>(initialRoleFilter);

  useCloseOnEscape(show, onClose);

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
          {renderFilterGroup({
            currentValue: granularity,
            groupName: "trend-granularity",
            legendText: "Granularity",
            onChange: changeGranularity,
            options: GRANULARITY_OPTIONS,
          })}
          {renderFilterGroup({
            currentValue: roleFilter,
            groupName: "trend-role-filter",
            legendText: "Crib role",
            onChange: changeRoleFilter,
            options: ROLE_OPTIONS,
          })}
        </div>

        {trend.isAtRecordCap ? (
          <div
            className={classes.horizonNotice}
            role="status"
          >
            Decision and skipped-hand history each retain up to 20,000 entries.
            This view may not include earlier play.
          </div>
        ) : null}

        <p className={classes.methodology}>
          Average loss is the expected points left on the table by your first
          discard, so lower is better. Rolling batches smooth small-sample
          swings; use each calendar period&apos;s decision count to judge its
          signal.
        </p>

        {roleFilter === "all" ? null : (
          <p className={classes.methodology}>
            Skipped hands are not assigned a crib role, so they are excluded
            from this filtered view.
          </p>
        )}

        {renderSummaryCards({
          avgLoss: overallAvgLoss,
          decisions: totalDecisions,
          optimalRate: overallOptimalRate,
          skipped: formatSkippedHands(totalDecisions, trend.totalSkippedHands),
        })}

        <DecisionQualityChart
          buckets={trend.buckets}
          granularity={granularity}
        />

        {renderBreakdownTable(trend.buckets)}
      </section>
    </Modal>
  );
}

DecisionQualityTrendDialog.defaultProps = {
  initialGranularity: "rolling20",
  initialRoleFilter: "all",
  tally: null,
};
