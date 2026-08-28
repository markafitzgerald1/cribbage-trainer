import * as classes from "./MistakeQueueDialog.module.css";
import {
  DIALOG_ROLE_OPTIONS,
  DialogFilterGroup,
  type DialogFilterOption,
} from "./DialogFilterGroup";
import {
  type MistakeQueueItem,
  type MistakeQueueQuantileFilter,
  type MistakeQueueQuantileThresholds,
  type MistakeQueueRoleFilter,
  type MistakeQueueSortOrder,
  type MistakeQueueStatusFilter,
  SUCCESSES_FOR_MASTERY,
  buildMistakeQueue,
  computeLossQuantileThresholds,
  filterMistakeQueue,
  sortMistakeQueue,
} from "../ui/mistakeQueue";
import type {
  StartAutoDrillHandler,
  StartDrillHandler,
} from "./usePracticeDrill";
import { type StoredTally, readTallyForDisplay } from "../ui/discardTally";
import { useCallback, useMemo, useState } from "react";
import { DialogSummaryCards } from "./DialogSummaryCards";
import { MistakeQueueItemCard } from "./MistakeQueueItemCard";
import Modal from "./Modal";
import { SortOrder } from "../ui/SortOrder";
import { useCloseOnEscape } from "./useCloseOnEscape";

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

const DECIMAL_DIGITS = 2;

export type MistakeQueueDialogProps = {
  readonly initialQuantileFilter?: MistakeQueueQuantileFilter;
  readonly initialRoleFilter?: MistakeQueueRoleFilter;
  readonly initialSortOrder?: MistakeQueueSortOrder;
  readonly initialStatusFilter?: MistakeQueueStatusFilter;
  readonly onClose: () => void;
  readonly onStartDrill?: StartDrillHandler;
  readonly onStartAutoDrill?: StartAutoDrillHandler;
  readonly show: boolean;
  readonly sortOrder?: SortOrder;
  readonly tally?: StoredTally | null | undefined;
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
      ariaLabel: `Medium severity (≥ ${mediumLabel}, < ${highLabel})`,
      label: `Med (≥ ${mediumLabel}, < ${highLabel})`,
      value: "medium",
    },
    {
      ariaLabel: `Low severity (< ${mediumLabel})`,
      label: `Low (< ${mediumLabel})`,
      value: "low",
    },
  ];
};

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

interface MistakeQueueBaseData {
  readonly activeCount: number;
  readonly allItems: readonly MistakeQueueItem[];
  readonly hasLifetimeMistakes: boolean;
  readonly masteredCount: number;
  readonly quantileOptions: readonly DialogFilterOption<MistakeQueueQuantileFilter>[];
  readonly totalCount: number;
}

function buildMistakeQueueBaseData(tally: StoredTally): MistakeQueueBaseData {
  const allItems = buildMistakeQueue(tally);
  const thresholds = computeLossQuantileThresholds(
    allItems.map((item) => item.lossIfWrong),
  );
  const quantileOptions = buildQuantileOptions(thresholds);
  const totalCount = allItems.length;
  const activeCount = allItems.filter((item) => !item.isMastered).length;
  const masteredCount = allItems.filter((item) => item.isMastered).length;
  const hasLifetimeMistakes =
    tally.lifetime.decisions > tally.lifetime.optimalDecisions;

  return {
    activeCount,
    allItems,
    hasLifetimeMistakes,
    masteredCount,
    quantileOptions,
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
  onStartAutoDrill = null,
  onStartDrill = null,
  show,
  sortOrder = SortOrder.Descending,
  tally = null,
}: MistakeQueueDialogProps): React.JSX.Element | null {
  const [filters, setFilters] = useState({
    quantile: initialQuantileFilter,
    role: initialRoleFilter,
    sort: initialSortOrder,
    status: initialStatusFilter,
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useCloseOnEscape(show, onClose);

  const handleShowMore = useCallback(() => {
    setVisibleCount((current) => current + PAGE_SIZE);
  }, []);

  const handleSortChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedSort = event.target.value as MistakeQueueSortOrder;
      setFilters((prev) => ({ ...prev, sort: selectedSort }));
    },
    [],
  );

  const handleStatusChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedStatus = event.target.value as MistakeQueueStatusFilter;
      setFilters((prev) => ({ ...prev, status: selectedStatus }));
    },
    [],
  );

  const handleRoleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedRole = event.target.value as MistakeQueueRoleFilter;
      setFilters((prev) => ({ ...prev, role: selectedRole }));
    },
    [],
  );

  const handleQuantileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedQuantile = event.target.value as MistakeQueueQuantileFilter;
      setFilters((prev) => ({ ...prev, quantile: selectedQuantile }));
    },
    [],
  );

  /*
   * `readTallyForDisplay` reconstructs the stored object on every call. Keep
   * that snapshot stable while the dialog is open so pagination does not
   * rebuild and re-sort the entire queue just because its visible page grew.
   */
  const activeTally = useMemo(
    () => (show ? (tally ?? readTallyForDisplay()) : null),
    [show, tally],
  );
  const baseQueueData = useMemo(
    () =>
      activeTally === null ? null : buildMistakeQueueBaseData(activeTally),
    [activeTally],
  );
  const derivedQueueData = useMemo(() => {
    if (baseQueueData === null) {
      return null;
    }
    const effectiveQuantileFilter =
      baseQueueData.quantileOptions.length > 0 ? filters.quantile : "all";
    const filteredItems = filterMistakeQueue(baseQueueData.allItems, {
      quantileFilter: effectiveQuantileFilter,
      roleFilter: filters.role,
      statusFilter: filters.status,
    });
    const sortedItems = sortMistakeQueue(filteredItems, filters.sort);
    const isAllMastered =
      filters.status === "active" &&
      baseQueueData.totalCount > 0 &&
      baseQueueData.activeCount === 0;

    return {
      isAllMastered,
      sortedItems,
    };
  }, [
    baseQueueData,
    filters.quantile,
    filters.role,
    filters.sort,
    filters.status,
  ]);

  if (!show || baseQueueData === null || derivedQueueData === null) {
    return null;
  }
  const {
    activeCount,
    hasLifetimeMistakes,
    masteredCount,
    quantileOptions,
    totalCount,
  } = baseQueueData;
  const { isAllMastered, sortedItems } = derivedQueueData;

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
        {/* Primary and secondary actions sit above the summary and filters so the way out of the dialog is on screen before the list is scrolled (AGENTS.md short-screen rule). */}
        <div className={classes.actionBar}>
          {onStartAutoDrill === null ? null : (
            <button
              className={classes.startDrillButton}
              disabled={activeCount === 0}
              onClick={onStartAutoDrill}
              type="button"
            >
              Start drill
            </button>
          )}
          <button
            className={classes.doneButton}
            onClick={onClose}
            type="button"
          >
            Done
          </button>
        </div>
        <p className={classes.subtitle}>
          Hands where you previously discarded sub-optimally. Master a hand by
          choosing the optimal discard {SUCCESSES_FOR_MASTERY} consecutive times
          in practice.
        </p>

        <DialogSummaryCards
          classes={classes}
          metrics={[
            { label: "Total mistakes", value: totalCount },
            { label: "Needs practice", value: activeCount },
            { label: "Mastered", value: masteredCount },
          ]}
        />

        <div className={classes.controls}>
          <DialogFilterGroup
            classes={classes}
            currentValue={filters.sort}
            groupName="mistake-sort-order"
            legendText="Sort by"
            onChange={handleSortChange}
            options={SORT_OPTIONS}
          />
          <DialogFilterGroup
            classes={classes}
            currentValue={filters.status}
            groupName="mistake-status-filter"
            legendText="Status"
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
          />
          <DialogFilterGroup
            classes={classes}
            currentValue={filters.role}
            groupName="mistake-role-filter"
            legendText="Crib role"
            onChange={handleRoleChange}
            options={DIALOG_ROLE_OPTIONS}
          />
          {quantileOptions.length > 0 && (
            <DialogFilterGroup
              classes={classes}
              currentValue={filters.quantile}
              groupName="mistake-quantile-filter"
              legendText="Loss severity"
              onChange={handleQuantileChange}
              options={quantileOptions}
            />
          )}
        </div>

        <div className={classes.itemsList}>
          {sortedItems.length === 0 ? (
            renderEmptyState({
              hasLifetimeMistakes,
              isAllMastered,
              totalCount,
            })
          ) : (
            <>
              {sortedItems.slice(0, visibleCount).map((item) => (
                <MistakeQueueItemCard
                  item={item}
                  key={item.handKey}
                  onPractice={onStartDrill}
                  sortOrder={sortOrder}
                />
              ))}
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
  onStartAutoDrill: null,
  onStartDrill: null,
  sortOrder: SortOrder.Descending,
  tally: null,
};
