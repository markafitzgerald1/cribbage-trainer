import * as classes from "./MistakeQueueDialog.module.css";
import { type Card, parseHand } from "../game/Card";
import {
  type LossQuantile,
  type MistakeQueueItem,
  SUCCESSES_FOR_MASTERY,
} from "../ui/mistakeQueue";
import {
  type MistakeClassification,
  formatNetLoss,
} from "../analysis/classifyMistake";
import { CribRole } from "../game/expectedCribPoints";
import { SortOrder } from "../ui/SortOrder";
import { SortedCardLabels } from "./SortedCardLabels";
import { useMemo } from "react";

const PERCENT_MULTIPLIER = 100;
const DECIMAL_DIGITS = 2;

export interface MistakeQueueItemCardProps {
  readonly classification?: MistakeClassification | null;
  readonly item: MistakeQueueItem;
  readonly lossReason?: string | null;
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
      {item.consecutiveSuccesses}/{SUCCESSES_FOR_MASTERY} successes
    </span>
  );

export function MistakeQueueItemCard({
  classification = null,
  item,
  lossReason = null,
  onPractice,
  sortOrder,
}: MistakeQueueItemCardProps): React.JSX.Element {
  const roleLabel = item.cribRole === CribRole.Dealer ? "Dealer" : "Pone";
  const errorRatePercent = (item.pWrong * PERCENT_MULTIPLIER).toFixed(0);
  // Null when there is no drill hand-off, which is also the branch that hides the button below.
  const handlePractice = useMemo(
    () => (onPractice === null ? null : () => onPractice(item)),
    [item, onPractice],
  );
  const effectiveReason = classification?.label ?? lossReason;
  const effectiveLoss = classification?.netLoss ?? item.previousDiscardLoss;

  return (
    <div className={classes.itemCard}>
      <div className={classes.itemHeader}>
        <div className={classes.itemBadges}>
          <span className={classes.roleBadge}>{roleLabel}</span>
          <span className={classes.lossBadge}>
            {formatNetLoss(item.lossIfWrong)} pts lost
          </span>
          {item.lossQuantile === null ? null : (
            <span
              className={`${classes.quantileBadge} ${getQuantileBadgeClass(item.lossQuantile)}`}
            >
              {item.lossQuantile}
            </span>
          )}
          {effectiveReason === null ? null : (
            <span
              aria-label={`Previous discard driven by ${effectiveReason}`}
              className={classes.componentBadge}
              title={`Previous discard (${formatNetLoss(effectiveLoss)} pts lost) driven by ${effectiveReason}`}
            >
              Prev: {effectiveReason}
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
        {handlePractice === null ? null : (
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

MistakeQueueItemCard.defaultProps = {
  classification: null,
  lossReason: null,
};
