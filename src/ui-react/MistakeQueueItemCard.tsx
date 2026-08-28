import * as classes from "./MistakeQueueDialog.module.css";
import { type Card, parseHand } from "../game/Card";
import type { LossQuantile, MistakeQueueItem } from "../ui/mistakeQueue";
import { CribRole } from "../game/expectedCribPoints";
import { SortOrder } from "../ui/SortOrder";
import { SortedCardLabels } from "./SortedCardLabels";
import { useCallback } from "react";

const PERCENT_MULTIPLIER = 100;
const DECIMAL_DIGITS = 2;

export interface MistakeQueueItemCardProps {
  readonly item: MistakeQueueItem;
  readonly onPractice: ((item: MistakeQueueItem) => void) | null;
  readonly sortOrder: SortOrder;
}

const getQuantileBadgeClass = (quantile: LossQuantile): string => {
  if (quantile === "high") {
    return classes.quantileHigh;
  }
  if (quantile === "medium") {
    return classes.quantileMedium;
  }
  return classes.quantileLow;
};

const renderCardsList = (
  cards: readonly Card[],
  sortOrder: SortOrder,
): React.JSX.Element => (
  <div className={classes.cardsRow}>
    <SortedCardLabels
      cards={cards}
      keyPrefix="queue"
      sortOrder={sortOrder}
    />
  </div>
);

const renderPreviousDiscard = (
  previousDiscard: string | null,
  sortOrder: SortOrder,
): React.JSX.Element => (
  <div className={classes.previousDiscard}>
    <span className={classes.previousDiscardLabel}>Previous discard:</span>
    {previousDiscard === null ? (
      <span className={classes.noPreviousDiscard}>
        Previous choice not recorded
      </span>
    ) : (
      renderCardsList(parseHand(previousDiscard), sortOrder)
    )}
  </div>
);

const renderStatusBadge = (item: MistakeQueueItem): React.JSX.Element =>
  item.isMastered ? (
    <span className={`${classes.statusBadge} ${classes.masteredBadge}`}>
      Mastered
    </span>
  ) : (
    <span className={`${classes.statusBadge} ${classes.activeBadge}`}>
      {item.consecutiveSuccesses}/2 successes
    </span>
  );

export function MistakeQueueItemCard({
  item,
  onPractice,
  sortOrder,
}: MistakeQueueItemCardProps): React.JSX.Element {
  const roleLabel = item.cribRole === CribRole.Dealer ? "Dealer" : "Pone";
  const errorRatePercent = (item.pWrong * PERCENT_MULTIPLIER).toFixed(0);
  const handlePractice = useCallback(() => {
    // The button wired to this renders only when onPractice is set (see below).
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onPractice!(item);
  }, [item, onPractice]);

  return (
    <div className={classes.itemCard}>
      <div className={classes.itemHeader}>
        <div className={classes.itemBadges}>
          <span className={classes.roleBadge}>{roleLabel}</span>
          <span className={classes.lossBadge}>
            {item.lossIfWrong.toFixed(DECIMAL_DIGITS)} pts lost
          </span>
          {item.lossQuantile === null ? null : (
            <span
              className={`${classes.quantileBadge} ${getQuantileBadgeClass(item.lossQuantile)}`}
            >
              {item.lossQuantile}
            </span>
          )}
        </div>
        <div>{renderStatusBadge(item)}</div>
      </div>

      {renderCardsList(item.cards, sortOrder)}

      <div className={classes.itemFooter}>
        {renderPreviousDiscard(item.previousDiscard, sortOrder)}
        <div className={classes.itemStats}>
          <span>Attempts: {item.attempts}</span>
          <span>Error rate: {errorRatePercent}%</span>
          <span>Priority: {item.priority.toFixed(DECIMAL_DIGITS)}</span>
        </div>
        {onPractice === null ? null : (
          <button
            className={classes.practiceButton}
            onClick={handlePractice}
            type="button"
          >
            Practice this
          </button>
        )}
      </div>
    </div>
  );
}
