import * as classes from "./MistakeQueueDialog.module.css";
import { type Card, parseHand } from "../game/Card";
import {
  DIALOG_ROLE_OPTIONS,
  DialogFilterGroup,
  type DialogFilterOption,
} from "./DialogFilterGroup";
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
import { DialogSummaryCards } from "./DialogSummaryCards";
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
/* jscpd:ignore-end */

const SORT_OPTIONS: readonly DialogFilterOption<MistakeQueueSortOrder>[] = [
  { label: "Priority", value: "priority" },
  { label: "Highest loss", value: "highestLoss" },
  { label: "Most recent", value: "mostRecent" },
];

const STATUS_OPTIONS: readonly DialogFilterOption<MistakeQueueStatusFilter>[] =
  [
    { label: "Active", value: "active" },
    { label: "Mastered", value: "mastered" },
    { ariaLabel: "All statuses", label: "All", value: "all" },
  ];

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
): readonly DialogFilterOption<MistakeQueueQuantileFilter>[] => {
  if (
    thresholds.highThreshold === 0 ||
    thresholds.mediumThreshold === 0 ||
    thresholds.highThreshold <= thresholds.mediumThreshold
  ) {
    return [];
  }
  const highLabel = thresholds.highThreshold.toFixed(DECIMAL_DIGITS);
  const mediumLabel = thresholds.mediumThreshold.toFixed(DECIMAL_DIGITS);

  return [
    { ariaLabel: "All loss tiers", label: "All", value: "all" },
    {
      ariaLabel: `High severity (≥ ${highLabel})`,
      label: `High (≥ ${highLabel})`,
      value: "high",
    },
    {
      ariaLabel: `Medium severity (${mediumLabel}–${highLabel})`,
      label: `Med (${mediumLabel}–${highLabel})`,
      value: "medium",
    },
    {
      ariaLabel: `Low severity (< ${mediumLabel})`,
      label: `Low (< ${mediumLabel})`,
      value: "low",
    },
  ];
};

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
  readonly hasLifetimeMistakes: boolean;
  readonly isAllMastered: boolean;
  readonly totalCount: number;
}): React.JSX.Element {
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

  let message = "No mistake hands match the selected filters.";
  if (options.totalCount === 0) {
    message = options.hasLifetimeMistakes
      ? "All recorded mistake hands have aged out of the recent history window. Play more hands to add new mistakes to your practice queue."
      : "No mistake hands recorded yet. Play authentic hands to build your practice queue.";
  }

  return (
    <div
      className={classes.emptyState}
      role="status"
    >
      {message}
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
  const hasLifetimeMistakes =
    tally.lifetime.decisions > tally.lifetime.optimalDecisions;

  return {
    activeCount,
    hasLifetimeMistakes,
    isAllMastered,
    masteredCount,
    quantileOptions: buildQuantileOptions(thresholds),
    sortedItems,
    totalCount,
  };
}

const PAGE_SIZE = 50;

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useCloseOnEscape(show, onClose);

  /* jscpd:ignore-start */
  const handleShowMore = useCallback(() => {
    setVisibleCount((current) => current + PAGE_SIZE);
  }, []);

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
    hasLifetimeMistakes,
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
          <DialogFilterGroup
            classes={classes}
            currentValue={sortOrder}
            groupName="mistake-sort-order"
            legendText="Sort by"
            onChange={changeSortOrder}
            options={SORT_OPTIONS}
          />
          <DialogFilterGroup
            classes={classes}
            currentValue={statusFilter}
            groupName="mistake-status-filter"
            legendText="Status"
            onChange={changeStatusFilter}
            options={STATUS_OPTIONS}
          />
          <DialogFilterGroup
            classes={classes}
            currentValue={roleFilter}
            groupName="mistake-role-filter"
            legendText="Crib role"
            onChange={changeRoleFilter}
            options={DIALOG_ROLE_OPTIONS}
          />
          {quantileOptions.length > 0 && (
            <DialogFilterGroup
              classes={classes}
              currentValue={quantileFilter}
              groupName="mistake-quantile-filter"
              legendText="Loss severity"
              onChange={changeQuantileFilter}
              options={quantileOptions}
            />
          )}
        </div>

        <DialogSummaryCards
          classes={classes}
          metrics={[
            { label: "Total mistakes", value: totalCount },
            { label: "Needs practice", value: activeCount },
            { label: "Mastered", value: masteredCount },
          ]}
        />

        <div className={classes.itemsList}>
          {sortedItems.length === 0 ? (
            renderEmptyState({
              hasLifetimeMistakes,
              isAllMastered,
              totalCount,
            })
          ) : (
            <>
              {sortedItems.slice(0, visibleCount).map(renderItemCard)}
              {sortedItems.length > visibleCount && (
                <div className={classes.paginationRow}>
                  <button
                    className={classes.showMoreButton}
                    onClick={handleShowMore}
                    type="button"
                  >
                    Show more ({sortedItems.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
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
