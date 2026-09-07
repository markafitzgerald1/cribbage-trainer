import * as classes from "./PracticeDrillPanel.module.css";
import type { PracticeDrillPhase, PracticeVerdict } from "./usePracticeDrill";
import { SUCCESSES_FOR_MASTERY } from "../ui/mistakeQueue";
import { SortOrder } from "../ui/SortOrder";
import { SortedCardLabels } from "./SortedCardLabels";
import { parseHand } from "../game/Card";

const LOSS_DIGITS = 2;

export interface PracticeDrillPanelProps {
  readonly canCommit: boolean;
  readonly hasNextHand: boolean;
  readonly onCommit: () => void;
  readonly onExit: () => void;
  readonly onNextHand: () => void;
  readonly phase: PracticeDrillPhase;
  readonly sortOrder: SortOrder;
  readonly verdict: PracticeVerdict | null;
}

interface VerdictRow {
  readonly discard: string | null;
  readonly label: string;
  readonly loss: number;
  readonly sortOrder: SortOrder;
}

/*
 * A plain magnitude, matching how "Lost per discard" and the trend view's
 * "Avg loss" already show what a discard gave up: it is a cost, never a gain,
 * so a sign would only be noise.
 */
const formatLoss = (loss: number): string => loss.toFixed(LOSS_DIGITS);

const renderDiscard = (
  discard: string | null,
  sortOrder: SortOrder,
): React.JSX.Element =>
  discard === null ? (
    <span className={classes.notRecorded}>not recorded</span>
  ) : (
    <span className={classes.discardCards}>
      <SortedCardLabels
        cards={parseHand(discard)}
        keyPrefix="drill-discard"
        sortOrder={sortOrder}
      />
    </span>
  );

const renderVerdictRow = ({
  discard,
  label,
  loss,
  sortOrder,
}: VerdictRow): React.JSX.Element => (
  <div className={classes.verdictRow}>
    <span className={classes.verdictLabel}>{label}</span>
    {renderDiscard(discard, sortOrder)}
    <span className={classes.verdictLoss}>{formatLoss(loss)}</span>
  </div>
);

const renderOutcome = (verdict: PracticeVerdict): React.JSX.Element => {
  if (verdict.isMastered) {
    return <p className={classes.outcomeMastered}>Mastered.</p>;
  }
  if (verdict.isOptimal) {
    return (
      <p className={classes.outcomeGood}>
        Optimal — {verdict.consecutiveSuccesses} of {SUCCESSES_FOR_MASTERY}{" "}
        toward mastery.
      </p>
    );
  }
  return (
    <p className={classes.outcomeMiss}>
      {formatLoss(verdict.chosenLoss)} behind the best discard — streak reset.
    </p>
  );
};

const renderActions = (
  primary: React.JSX.Element | null,
  onExit: () => void,
): React.JSX.Element => (
  <div className={classes.actions}>
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

const renderVerdict = (
  verdict: PracticeVerdict,
  { hasNextHand, onExit, onNextHand, sortOrder }: PracticeDrillPanelProps,
): React.JSX.Element => (
  <div className={classes.verdict}>
    {renderVerdictRow({
      discard: verdict.chosenDiscard,
      label: "Now",
      loss: verdict.chosenLoss,
      sortOrder,
    })}
    {renderVerdictRow({
      discard: verdict.previousDiscard,
      label: "Before",
      loss: verdict.previousLoss,
      sortOrder,
    })}
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
      <span className={classes.badge}>Practice</span>
      {renderBody({
        canCommit,
        hasNextHand,
        onCommit,
        onExit,
        onNextHand,
        phase,
        sortOrder,
        verdict,
      })}
    </section>
  );
}
