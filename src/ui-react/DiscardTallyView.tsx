import * as classes from "./DiscardTallyView.module.css";
import type { DiscardTallySummary } from "../ui/discardTally";
import type { ReactNode } from "react";

const LOSS_FRACTION_DIGITS = 2;

interface DiscardTallyViewProps {
  readonly summary: DiscardTallySummary;
}

/*
 * The running cost of a player's own discards, across every session on this
 * browser. It reads as an average rather than a total because a total only
 * says how much has been played; the point is whether the choices are getting
 * cheaper.
 */
export function DiscardTallyView({
  summary,
}: DiscardTallyViewProps): ReactNode {
  /*
   * A browser that has completed no discards has nothing to average, and a
   * zero here would read as perfect play rather than as no evidence.
   */
  if (summary.meanExpectedPointsLoss === null) {
    return null;
  }
  return (
    <p className={classes.tally}>
      <span>
        <span className={classes.label}>Average cost </span>
        <span className={classes.figure}>
          {summary.meanExpectedPointsLoss.toFixed(LOSS_FRACTION_DIGITS)}
        </span>
      </span>
      <span>
        <span className={classes.figure}>{summary.optimalDecisions}</span>
        <span className={classes.label}> of </span>
        <span className={classes.figure}>{summary.decisions}</span>
        <span className={classes.label}> discards were best</span>
      </span>
    </p>
  );
}
