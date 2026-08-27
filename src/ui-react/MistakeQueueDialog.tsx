import * as classes from "./MistakeQueueDialog.module.css";
import { type Card, parseHand } from "../game/Card";
import {
  type LossQuantile,
  type MistakeQueueItem,
  type MistakeQueueQuantileFilter,
  type MistakeQueueQuantileThresholds,
  type MistakeQueueRoleFilter,
  type MistakeQueueSortOrder,
  type MistakeQueueStatusFilter,
  buildMistakeQueue,
  computeLossQuantileThresholds,
  filterMistakeQueue,
  sortMistakeQueue,
} from "../ui/mistakeQueue";
import { type StoredTally, readTallyForDisplay } from "../ui/discardTally";
import { useCallback, useState } from "react";
import { CardLabel } from "./CardLabel";
import { CribRole } from "../game/expectedCribPoints";
import Modal from "./Modal";
import { useCloseOnEscape } from "./useCloseOnEscape";

/* jscpd:ignore-start */
export interface MistakeQueueDialogProps {
  readonly initialQuantileFilter?: MistakeQueueQuantileFilter;
  readonly initialRoleFilter?: MistakeQueueRoleFilter;
  readonly initialSortOrder?: MistakeQueueSortOrder;
  readonly initialStatusFilter?: MistakeQueueStatusFilter;
  readonly onClose: () => void;
  readonly show: boolean;
  readonly tally?: StoredTally | null;
}

const SORT_OPTIONS: {
  readonly label: string;
  readonly value: MistakeQueueSortOrder;
}[] = [
  { label: "Priority", value: "priority" },
  { label: "Highest loss", value: "highestLoss" },
  { label: "Most recent", value: "mostRecent" },
];

const STATUS_OPTIONS: {
  readonly label: string;
  readonly value: MistakeQueueStatusFilter;
}[] = [
  { label: "Active", value: "active" },
  { label: "Mastered", value: "mastered" },
  { label: "All", value: "all" },
];

const ROLE_OPTIONS: {
  readonly label: string;
  readonly value: MistakeQueueRoleFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Dealer", value: "dealer" },
  { label: "Pone", value: "pone" },
];
/* jscpd:ignore-end */

const PERCENT_MULTIPLIER = 100;
const DECIMAL_DIGITS = 2;

const getQuantileBadgeClass = (quantile: LossQuantile): string => {
  switch (quantile) {
    case "high":
      return classes.quantileHigh;
    case "medium":
      return classes.quantileMedium;
    case "low":
    default:
      return classes.quantileLow;
  }
};

const buildQuantileOptions = (
  thresholds: MistakeQueueQuantileThresholds,
): { readonly label: string; readonly value: MistakeQueueQuantileFilter }[] => {
  if (thresholds.highThreshold === 0 && thresholds.mediumThreshold === 0) {
    return [{ label: "All", value: "all" }];
  }
  const highLabel = thresholds.highThreshold.toFixed(DECIMAL_DIGITS);
  const mediumLabel = thresholds.mediumThreshold.toFixed(DECIMAL_DIGITS);

  const options: { label: string; value: MistakeQueueQuantileFilter }[] = [
    { label: "All", value: "all" },
    { label: `High (≥ ${highLabel})`, value: "high" },
  ];

  if (thresholds.highThreshold !== thresholds.mediumThreshold) {
    options.push(
      { label: `Med (${mediumLabel}–${highLabel})`, value: "medium" },
      { label: `Low (< ${mediumLabel})`, value: "low" },
    );
  }

  return options;
};

/* jscpd:ignore-start */
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

function renderSummaryCards(options: {
  readonly active: number;
  readonly mastered: number;
  readonly total: number;
}): React.JSX.Element {
  const metrics: { readonly label: string; readonly value: number }[] = [
    { label: "Total mistakes", value: options.total },
    { label: "Needs practice", value: options.active },
    { label: "Mastered", value: options.mastered },
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
/* jscpd:ignore-end */

/* jscpd:ignore-start */
function renderCardsRow(cards: readonly Card[]): React.JSX.Element {
  return (
    <div className={classes.cardsRow}>
      {cards.map((card, index) => (
        <CardLabel
          // eslint-disable-next-line react/no-array-index-key
          key={`${card.rank}-${card.suit}-${index}`}
          rank={card.rank}
          suit={card.suit}
        />
      ))}
    </div>
  );
}
/* jscpd:ignore-end */

function renderPreviousDiscard(
  previousDiscard: string | null,
): React.JSX.Element {
  return (
    <div className={classes.previousDiscard}>
      <span className={classes.previousDiscardLabel}>Previous discard:</span>
      {previousDiscard === null ? (
        <span className={classes.noPreviousDiscard}>
          Previous choice not recorded
        </span>
      ) : (
        renderCardsRow(parseHand(previousDiscard))
      )}
    </div>
  );
}

function renderItemCard(item: MistakeQueueItem): React.JSX.Element {
  const roleLabel = item.cribRole === CribRole.Dealer ? "Dealer" : "Pone";
  const errorRatePercent = (item.pWrong * PERCENT_MULTIPLIER).toFixed(0);

  return (
    <div
      className={classes.itemCard}
      key={item.handKey}
    >
      <div className={classes.itemHeader}>
        <div className={classes.itemBadges}>
          <span className={classes.roleBadge}>{roleLabel}</span>
          <span className={classes.lossBadge}>
            {item.lossIfWrong.toFixed(DECIMAL_DIGITS)} pts lost
          </span>
          <span
            className={`${classes.quantileBadge} ${getQuantileBadgeClass(item.lossQuantile)}`}
          >
            {item.lossQuantile}
          </span>
        </div>
        <div>
          {item.isMastered ? (
            <span className={`${classes.statusBadge} ${classes.masteredBadge}`}>
              Mastered
            </span>
          ) : (
            <span className={`${classes.statusBadge} ${classes.activeBadge}`}>
              {item.consecutiveSuccesses}/2 successes
            </span>
          )}
        </div>
      </div>

      {renderCardsRow(item.cards)}

      <div className={classes.itemFooter}>
        {renderPreviousDiscard(item.previousDiscard)}
        <div className={classes.itemStats}>
          <span>Attempts: {item.attempts}</span>
          <span>Error rate: {errorRatePercent}%</span>
          <span>Priority: {item.priority.toFixed(DECIMAL_DIGITS)}</span>
        </div>
      </div>
    </div>
  );
}

function renderEmptyState(options: {
  readonly hasTotalMistakes: boolean;
  readonly isAllMastered: boolean;
}): React.JSX.Element {
  if (!options.hasTotalMistakes) {
    return (
      <div
        className={classes.emptyState}
        role="status"
      >
        No mistake hands recorded yet. Play authentic hands to build your
        practice queue.
      </div>
    );
  }

  if (options.isAllMastered) {
    return (
      <div
        className={classes.allMasteredNotice}
        role="status"
      >
        <h3 className={classes.allMasteredHeading}>
          All mistake hands mastered!
        </h3>
        <p className={classes.allMasteredBody}>
          You have mastered every sub-optimal hand in your history. Keep playing
          authentic games to challenge yourself!
        </p>
      </div>
    );
  }

  return (
    <div
      className={classes.emptyState}
      role="status"
    >
      No mistake hands match the selected filters.
    </div>
  );
}

interface MistakeDialogFilters {
  readonly quantileFilter: MistakeQueueQuantileFilter;
  readonly roleFilter: MistakeQueueRoleFilter;
  readonly sortOrder: MistakeQueueSortOrder;
  readonly statusFilter: MistakeQueueStatusFilter;
}

function computeMistakeDialogData(
  tally: StoredTally,
  filters: MistakeDialogFilters,
) {
  const allItems = buildMistakeQueue(tally);
  const thresholds = computeLossQuantileThresholds(
    allItems.map((item) => item.lossIfWrong),
  );
  const filteredItems = filterMistakeQueue(allItems, filters);
  const sortedItems = sortMistakeQueue(filteredItems, filters.sortOrder);
  const totalCount = allItems.length;
  const activeCount = allItems.filter((item) => !item.isMastered).length;
  const masteredCount = allItems.filter((item) => item.isMastered).length;
  const isAllMastered =
    filters.statusFilter === "active" && totalCount > 0 && activeCount === 0;

  return {
    activeCount,
    isAllMastered,
    masteredCount,
    quantileOptions: buildQuantileOptions(thresholds),
    sortedItems,
    totalCount,
  };
}

export function MistakeQueueDialog({
  initialQuantileFilter = "all",
  initialRoleFilter = "all",
  initialSortOrder = "priority",
  initialStatusFilter = "active",
  onClose,
  show,
  tally = null,
}: MistakeQueueDialogProps): React.JSX.Element | null {
  const [sortOrder, setSortOrder] =
    useState<MistakeQueueSortOrder>(initialSortOrder);
  const [statusFilter, setStatusFilter] =
    useState<MistakeQueueStatusFilter>(initialStatusFilter);
  const [roleFilter, setRoleFilter] =
    useState<MistakeQueueRoleFilter>(initialRoleFilter);
  const [quantileFilter, setQuantileFilter] =
    useState<MistakeQueueQuantileFilter>(initialQuantileFilter);

  useCloseOnEscape(show, onClose);

  /* jscpd:ignore-start */
  const changeSortOrder = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSortOrder(event.currentTarget.value as MistakeQueueSortOrder);
    },
    [],
  );

  const changeStatusFilter = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setStatusFilter(event.currentTarget.value as MistakeQueueStatusFilter);
    },
    [],
  );

  const changeRoleFilter = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRoleFilter(event.currentTarget.value as MistakeQueueRoleFilter);
    },
    [],
  );

  const changeQuantileFilter = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuantileFilter(
        event.currentTarget.value as MistakeQueueQuantileFilter,
      );
    },
    [],
  );

  if (!show) {
    return null;
  }

  const sourceTally = tally ?? readTallyForDisplay();
  /* jscpd:ignore-end */
  const {
    activeCount,
    isAllMastered,
    masteredCount,
    quantileOptions,
    sortedItems,
    totalCount,
  } = computeMistakeDialogData(sourceTally, {
    quantileFilter,
    roleFilter,
    sortOrder,
    statusFilter,
  });

  return (
    <Modal
      onClose={onClose}
      show={show}
    >
      <section
        aria-label="Mistake queue"
        className={classes.dialog}
      >
        <h2 className={classes.title}>Mistake queue</h2>
        <p className={classes.subtitle}>
          Hands where you previously discarded sub-optimally. Master a hand by
          choosing the optimal discard 2 consecutive times in practice.
        </p>

        <div className={classes.controls}>
          {renderFilterGroup({
            currentValue: sortOrder,
            groupName: "mistake-sort-order",
            legendText: "Sort by",
            onChange: changeSortOrder,
            options: SORT_OPTIONS,
          })}
          {renderFilterGroup({
            currentValue: statusFilter,
            groupName: "mistake-status-filter",
            legendText: "Status",
            onChange: changeStatusFilter,
            options: STATUS_OPTIONS,
          })}
          {renderFilterGroup({
            currentValue: roleFilter,
            groupName: "mistake-role-filter",
            legendText: "Crib role",
            onChange: changeRoleFilter,
            options: ROLE_OPTIONS,
          })}
          {renderFilterGroup({
            currentValue: quantileFilter,
            groupName: "mistake-quantile-filter",
            legendText: "Loss severity",
            onChange: changeQuantileFilter,
            options: quantileOptions,
          })}
        </div>

        {renderSummaryCards({
          active: activeCount,
          mastered: masteredCount,
          total: totalCount,
        })}

        <div className={classes.itemsList}>
          {sortedItems.length === 0
            ? renderEmptyState({
                hasTotalMistakes: totalCount > 0,
                isAllMastered,
              })
            : sortedItems.map(renderItemCard)}
        </div>
      </section>
    </Modal>
  );
}

MistakeQueueDialog.defaultProps = {
  initialQuantileFilter: "all",
  initialRoleFilter: "all",
  initialSortOrder: "priority",
  initialStatusFilter: "active",
  tally: null,
};
