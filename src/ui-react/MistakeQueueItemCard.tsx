import * as classes from "./MistakeQueueDialog.module.css";
import { type Card, parseHand } from "../game/Card";
import {
  type LossQuantile,
  type MistakeQueueItem,
  SUCCESSES_FOR_MASTERY,
} from "../ui/mistakeQueue";
import {
  type MistakeClassification,
  formatAccessibleNetLoss,
  formatNetLoss,
} from "../analysis/classifyMistake";
import { sameTableIdentity, shippedTableIdentity } from "../game/tableIdentity";
import { CribRole } from "../game/expectedCribPoints";
import { SortOrder } from "../ui/SortOrder";
import { SortedCardLabels } from "./SortedCardLabels";
import { renderRoleLossPairText } from "./RoleLossPairText";
import { roleLossPairLabel } from "../analysis/oppositeRoleLoss";
import { useMemo } from "react";

const PERCENT_MULTIPLIER = 100;
const DECIMAL_DIGITS = 2;
const FINGERPRINT_PREVIEW_LENGTH = 12;

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

/*
 * Both role costs for the previous discard, beside the component badge
 * rather than instead of it (#824). Read from the record, so it needs no
 * classification and is available for the whole queue. The badge is dropped
 * rather than shown as a single figure whenever the label carries no
 * reversed-role clause — the record predates store version 6, or the other
 * role would not have suited the discard better — because the single figure
 * it would show is already on the loss badge above.
 */
const renderRoleLossPairBadge = (
  item: MistakeQueueItem,
): React.JSX.Element | null => {
  const pair = roleLossPairLabel(
    item.cribRole,
    item.previousDiscardLoss,
    item.previousDiscardOppositeRoleLoss,
  );
  if (pair.oppositeRoleCost === "") {
    return null;
  }
  const description = `Previous discard cost ${pair.accessibleLabel}`;
  return (
    <span
      aria-label={description}
      className={classes.oppositeRoleBadge}
      role="note"
      title={description}
    >
      {renderRoleLossPairText(pair)}
    </span>
  );
};

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

const renderTableFingerprint = (
  role: "Crib" | "Play",
  digest: string,
): React.JSX.Element => {
  const preview = digest.slice(0, FINGERPRINT_PREVIEW_LENGTH);
  return (
    <div
      aria-label={`${role} table fingerprint ${preview}`}
      role="note"
      title={digest}
    >
      {role}: {preview}…
    </div>
  );
};

const renderOriginalTables = (item: MistakeQueueItem): React.JSX.Element => {
  const identity = item.tableIdentity;
  if (!identity) return <span>Original tables unknown</span>;
  const label = sameTableIdentity(identity, shippedTableIdentity)
    ? "Judged with current tables"
    : "Judged with different tables";
  return (
    <details className={classes.tableProvenance}>
      <summary>{label}</summary>
      <div>Table fingerprints (for bug reports)</div>
      {renderTableFingerprint("Crib", identity.crib.means_sha256)}
      {renderTableFingerprint("Play", identity.play.means_sha256)}
    </details>
  );
};

// The sort key is this average, which mixes the recorded cost with every wrong retry.
const renderAverageLoss = (item: MistakeQueueItem): React.JSX.Element | null =>
  item.wrong > 1 ? (
    <span
      aria-label={`Average over ${item.wrong} wrong attempts: ${formatAccessibleNetLoss(item.lossIfWrong)} points`}
      role="note"
    >
      Average over {item.wrong} wrong attempts:{" "}
      <span className={classes.pointsValue}>
        {formatNetLoss(item.lossIfWrong)} points
      </span>
    </span>
  ) : null;

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
  const effectiveReason = classification?.accessibleLabel ?? lossReason;
  const effectiveShortReason = classification?.shortLabel ?? lossReason;
  const effectiveLoss = classification?.netLoss ?? item.previousDiscardLoss;

  return (
    <div className={classes.itemCard}>
      <div className={classes.itemHeader}>
        <div className={classes.itemBadges}>
          <span className={classes.roleBadge}>{roleLabel}</span>
          {item.lossQuantile === null ? null : (
            <span
              className={`${classes.quantileBadge} ${getQuantileBadgeClass(item.lossQuantile)}`}
            >
              {item.lossQuantile}
            </span>
          )}
          <span
            aria-label={`Recorded cost: ${formatAccessibleNetLoss(item.previousDiscardLoss)} points`}
            className={classes.lossBadge}
            role="note"
          >
            Recorded cost:{" "}
            <span className={classes.pointsValue}>
              {formatNetLoss(item.previousDiscardLoss)} points
            </span>
          </span>
          {effectiveReason === null ? null : (
            <span
              aria-label={`Current-table comparison: ${effectiveReason}`}
              className={classes.componentBadge}
              role="note"
              title={`Current-table comparison (${formatAccessibleNetLoss(effectiveLoss)} pts lost): ${effectiveReason}`}
            >
              Current-table comparison: {effectiveShortReason}
            </span>
          )}
          {renderRoleLossPairBadge(item)}
        </div>
        <div>{renderStatusBadge(item)}</div>
      </div>

      {renderOriginalTables(item)}
      {renderCardsList(item.cards, sortOrder)}

      <div className={classes.itemFooter}>
        {renderPreviousDiscard(item.previousDiscard, sortOrder)}
        <div className={classes.itemStats}>
          {renderAverageLoss(item)}
          <span>Attempts: {item.attempts}</span>
          <span>Error rate: {errorRatePercent}%</span>
          <span>
            Priority from recorded attempts:{" "}
            {item.priority.toFixed(DECIMAL_DIGITS)}
          </span>
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
