import * as classes from "./DiscardTallyView.module.css";
import type { DiscardTallySummary } from "../ui/discardTally";
import type { ReactNode } from "react";

const LOSS_FRACTION_DIGITS = 2;
const SHARE_FRACTION_DIGITS = 1;
const PER_CENT = 100;

/*
 * One decimal at every count rather than a whole number for some and a
 * fraction for others, so two shares on the same line stay comparable at a
 * glance. A format that changes shape as the denominator fills is harder to
 * read than one that does not.
 */
const shareOf = (part: number, whole: number) =>
  `${((part / whole) * PER_CENT).toFixed(SHARE_FRACTION_DIGITS)}%`;

interface DiscardTallyViewProps {
  readonly summary: DiscardTallySummary;
}

// The period word and the figures beside it are one shape, so both measures build it here rather than each spelling it out.
const renderPeriod = (period: string, figures: ReactNode) => (
  <span>
    <span className={classes.label}>{period} </span>
    {figures}
  </span>
);

const renderMean = (period: string, mean: number) =>
  renderPeriod(
    period,
    <span className={classes.figure}>
      {mean.toFixed(LOSS_FRACTION_DIGITS)}
    </span>,
  );

const renderShare = (period: string, optimal: number, decisions: number) =>
  renderPeriod(
    period,
    <>
      <span className={classes.figure}>{optimal}</span>
      <span className={classes.label}> of </span>
      <span className={classes.figure}>{decisions}</span>
      <span className={classes.label}> ({shareOf(optimal, decisions)})</span>
    </>,
  );

const renderRow = (measure: string, today: ReactNode, allTime: ReactNode) => (
  <p className={classes.row}>
    <span className={classes.label}>{measure}</span>
    {today}
    {allTime}
  </p>
);

/*
 * What a player's own discards have given up against the best available one,
 * across every session on this browser. Named for the quantity rather than
 * for the idea — "cost" alone left a reader asking what was being spent —
 * and phrased per discard because a total only says how much has been played.
 *
 * One row per measure with both periods named inside it, rather than one row
 * per period. Every figure then sits beside the word that scopes it: an
 * earlier layout put "today 0.87 over 5" next to a lifetime average carrying
 * no period at all, and a reader could not tell which the count belonged to.
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
    <div className={classes.tally}>
      {renderRow(
        "Points lost per discard",
        summary.todayMeanExpectedPointsLoss === null
          ? null
          : renderMean("today", summary.todayMeanExpectedPointsLoss),
        renderMean("all time", summary.meanExpectedPointsLoss),
      )}
      {renderRow(
        "Best choice",
        summary.todayDecisions === 0
          ? null
          : renderShare(
              "today",
              summary.todayOptimalDecisions,
              summary.todayDecisions,
            ),
        renderShare("all time", summary.optimalDecisions, summary.decisions),
      )}
    </div>
  );
}
