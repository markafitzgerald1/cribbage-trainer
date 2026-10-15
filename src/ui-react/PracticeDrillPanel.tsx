import * as classes from "./PracticeDrillPanel.module.css";
import type { PracticeDrillPhase, PracticeVerdict } from "./usePracticeDrill";
import {
  formatAccessibleNetLoss,
  formatNetLoss,
} from "../analysis/classifyMistake";
import { SUCCESSES_FOR_MASTERY } from "../ui/mistakeQueue";
import { SortOrder } from "../ui/SortOrder";
import { SortedCardLabels } from "./SortedCardLabels";
import { parseHand } from "../game/Card";
import { sameTableIdentity } from "../game/tableIdentity";

export interface PracticeDrillPanelProps {
  readonly canCommit: boolean;
  readonly hasNextHand: boolean;
  readonly onCommit: () => void;
  readonly onExit: () => void;
  readonly onLocateEarlierChoice?: () => void;
  readonly onNextHand: () => void;
  readonly phase: PracticeDrillPhase;
  readonly sortOrder: SortOrder;
  readonly verdict: PracticeVerdict | null;
}

interface VerdictRow {
  readonly discard: string | null;
  readonly label: string;
  readonly loss: number;
  readonly onLocate?: (() => void) | undefined;
  readonly sortOrder: SortOrder;
}

const defaultLocateEarlier = (): void => {
  const row = document.getElementById("drill-earlier-choice-row");
  if (row) {
    row.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    row.focus();
  }
};

/*
 * A plain magnitude, matching how "Lost per discard" and the trend view's
 * "Avg loss" already show what a discard gave up: it is a cost, never a gain,
 * so a sign would only be noise.
 */
const formatLoss = (loss: number): string => formatNetLoss(loss);

const renderDiscard = (
  discard: string | null,
  sortOrder: SortOrder,
  onLocate?: () => void,
): React.JSX.Element => {
  if (discard === null) {
    return <span className={classes.notRecorded}>not recorded</span>;
  }
  const cards = (
    <SortedCardLabels
      cards={parseHand(discard)}
      keyPrefix="drill-discard"
      sortOrder={sortOrder}
    />
  );
  if (onLocate) {
    return (
      <button
        aria-label="Scroll to previous mistake in table"
        className={classes.locateEarlierButton}
        onClick={onLocate}
        title="Scroll to previous mistake in table"
        type="button"
      >
        {cards}
        <span
          aria-hidden="true"
          className={classes.locateIcon}
        >
          ↓
        </span>
      </button>
    );
  }
  return <span className={classes.discardCards}>{cards}</span>;
};

const renderVerdictRow = ({
  discard,
  label,
  loss,
  onLocate,
  sortOrder,
}: VerdictRow): React.JSX.Element => (
  <div className={classes.verdictRow}>
    <span className={classes.verdictLabel}>{label}</span>
    <div className={classes.verdictValues}>
      {renderDiscard(discard, sortOrder, onLocate)}
      {/* A generic span cannot carry a name, so the role is what lets the spoken sub-cent form replace the visible "<". */}
      <span
        aria-label={`${label}, ${formatAccessibleNetLoss(loss)} points`}
        className={classes.verdictLoss}
        role="note"
      >
        {formatLoss(loss)}
      </span>
    </div>
  </div>
);

const renderOutcome = (verdict: PracticeVerdict): React.JSX.Element => {
  if (verdict.isMastered) {
    return <p className={classes.outcomeMastered}>Mastered.</p>;
  }
  if (verdict.isOptimal) {
    return (
      <p className={classes.outcomeGood}>
        Best choice with current tables. {verdict.consecutiveSuccesses} of{" "}
        {SUCCESSES_FOR_MASTERY} successful retries toward mastery.
      </p>
    );
  }
  return (
    <p
      aria-label={`${formatAccessibleNetLoss(verdict.chosenLoss)} points behind the best choice with current tables.`}
      className={classes.outcomeMiss}
      role="note"
    >
      {formatLoss(verdict.chosenLoss)} points behind the best choice with
      current tables.
    </p>
  );
};

const renderActions = (
  primary: React.JSX.Element | null,
  onExit: () => void,
): React.JSX.Element => (
  <div className={classes.actions}>
    <span className={classes.badge}>Practice</span>
    {primary}
    <button
      className={classes.secondary}
      onClick={onExit}
      type="button"
    >
      Exit drill
    </button>
  </div>
);

const renderChoosing = ({
  canCommit,
  onCommit,
  onExit,
}: PracticeDrillPanelProps): React.JSX.Element => (
  <div className={classes.choosing}>
    <p className={classes.prompt}>
      Choose two cards to discard, then check your answer.
    </p>
    {/* Reshuffled from the original mistake so recognizing the picture cannot substitute for re-deriving the answer. */}
    <p className={classes.suitNote}>Suits reshuffled for this drill.</p>
    {renderActions(
      <button
        className={classes.primary}
        disabled={!canCommit}
        onClick={onCommit}
        type="button"
      >
        Check discard
      </button>,
      onExit,
    )}
  </div>
);

const renderTableBoundary = (
  verdict: PracticeVerdict,
): React.JSX.Element | null => {
  const original = verdict.originalTableIdentity;
  const retry = verdict.retryTableIdentity;
  if (!retry)
    return <p className={classes.provenanceNote}>Table versions unknown.</p>;
  if (!original)
    return (
      <p className={classes.provenanceNote}>
        The original tables were not recorded. This retry uses current tables.
      </p>
    );
  return sameTableIdentity(original, retry) ? null : (
    <p className={classes.provenanceNote}>
      Tables changed since this decision. Its recorded cost is from the original
      tables; this retry uses the current tables.
    </p>
  );
};

const renderVerdict = (
  verdict: PracticeVerdict,
  {
    hasNextHand,
    onExit,
    onLocateEarlierChoice,
    onNextHand,
    sortOrder,
  }: PracticeDrillPanelProps,
): React.JSX.Element => (
  <div className={classes.verdict}>
    {renderOutcome(verdict)}
    {renderActions(
      hasNextHand ? (
        <button
          className={classes.primary}
          onClick={onNextHand}
          type="button"
        >
          Draw another
        </button>
      ) : null,
      onExit,
    )}
    {renderVerdictRow({
      discard: verdict.chosenDiscard,
      label: "Retry — current tables",
      loss: verdict.chosenLoss,
      sortOrder,
    })}
    {renderVerdictRow({
      discard: verdict.previousDiscard,
      label: "Then — recorded cost",
      loss: verdict.previousLoss,
      ...(verdict.previousDiscard === null
        ? {}
        : { onLocate: onLocateEarlierChoice }),
      sortOrder,
    })}
    {renderTableBoundary(verdict)}
  </div>
);

const renderBody = (props: PracticeDrillPanelProps): React.JSX.Element => {
  if (props.phase === "choosing") {
    return renderChoosing(props);
  }
  if (props.verdict === null) {
    // Exit stays reachable here: if the tables never load there is no verdict and no other way out of the drill.
    return (
      <div className={classes.choosing}>
        <p className={classes.prompt}>Checking your discard…</p>
        {renderActions(null, props.onExit)}
      </div>
    );
  }
  return renderVerdict(props.verdict, props);
};

export function PracticeDrillPanel({
  canCommit,
  hasNextHand,
  onCommit,
  onExit,
  onLocateEarlierChoice = defaultLocateEarlier,
  onNextHand,
  phase,
  sortOrder,
  verdict,
}: PracticeDrillPanelProps): React.JSX.Element {
  return (
    <section
      aria-label="Practice drill"
      className={classes.panel}
    >
      {renderBody({
        canCommit,
        hasNextHand,
        onCommit,
        onExit,
        onLocateEarlierChoice,
        onNextHand,
        phase,
        sortOrder,
        verdict,
      })}
    </section>
  );
}

PracticeDrillPanel.defaultProps = {
  onLocateEarlierChoice: defaultLocateEarlier,
};
