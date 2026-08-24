import * as classes from "./DiscardTallyView.module.css";
import type { DiscardTallySummary } from "../ui/discardTally";
import type { ReactNode } from "react";

const LOSS_FRACTION_DIGITS = 2;
const SHARE_FRACTION_DIGITS = 1;
const PER_CENT = 100;

/*
 * One decimal at every count rather than a whole number for some and a
 * fraction for others, so two shares on the same row stay comparable at a
 * glance.
 */
const shareOf = (part: number, whole: number) =>
  `${((part / whole) * PER_CENT).toFixed(SHARE_FRACTION_DIGITS)}%`;

const countAndShare = (part: number, whole: number) =>
  `${part}/${whole} (${shareOf(part, whole)})`;

// An empty cell holds the column open; omitting it would shift every figure to its left.
const blankWhen = (hasToday: boolean) => (hasToday ? "" : null);

interface DiscardTallyViewProps {
  readonly summary: DiscardTallySummary;
}

const renderMeasure = (
  measure: string,
  today: string | null,
  allTime: string,
) => (
  <>
    <span className={classes.label}>{measure}</span>
    {today === null ? null : <span className={classes.figure}>{today}</span>}
    <span className={classes.figure}>{allTime}</span>
  </>
);

/*
 * What a player's own discards have given up against the best available one,
 * across every session on this browser. Named for the quantity rather than
 * the idea — "cost" alone left a reader asking what was being spent — and
 * phrased per discard because a total only says how much has been played.
 *
 * A grid of measures against periods, rather than sentences that wrap. Each
 * period is named once in a heading and every figure sits in its column, so
 * a reader can compare down as well as across. The sentence form put a label
 * and two figures on one line and let them wrap wherever they ran out of
 * room, which on a phone turned two rows into four ragged ones.
 */
export function DiscardTallyView({
  summary,
}: DiscardTallyViewProps): ReactNode {
  /*
   * Nothing is shown until a hand has been either played or walked away from.
   * Skips alone are enough: a player who has only avoided hands is exactly
   * who this row was added for, and hiding it until they complete a discard
   * would keep it from the one person it has something to say to.
   */
  const faced = summary.decisions + summary.skippedHands;
  if (faced === 0) {
    return null;
  }
  const facedToday = summary.todayDecisions + summary.todaySkippedHands;
  const hasToday = facedToday > 0;
  const columns = hasToday ? classes.withToday : classes.allTimeOnly;
  return (
    <div className={`${classes.tally} ${columns}`}>
      <span />
      {hasToday ? <span className={classes.period}>today</span> : null}
      <span className={classes.period}>all time</span>
      {/*
       * The decision measures are blank rather than absent when nothing has
       * been scored, so the skip row below keeps its columns and a reader
       * sees which figures exist rather than a table that changes shape.
       */}
      {/* Guarded on the mean rather than the count, which says the same thing and leaves no branch that cannot run. */}
      {summary.meanExpectedPointsLoss === null
        ? null
        : renderMeasure(
            "Points lost per discard",
            summary.todayMeanExpectedPointsLoss === null
              ? blankWhen(hasToday)
              : summary.todayMeanExpectedPointsLoss.toFixed(
                  LOSS_FRACTION_DIGITS,
                ),
            summary.meanExpectedPointsLoss.toFixed(LOSS_FRACTION_DIGITS),
          )}
      {summary.decisions === 0
        ? null
        : renderMeasure(
            "Best choice",
            summary.todayDecisions === 0
              ? blankWhen(hasToday)
              : countAndShare(
                  summary.todayOptimalDecisions,
                  summary.todayDecisions,
                ),
            countAndShare(summary.optimalDecisions, summary.decisions),
          )}
      {/*
       * Only once a hand has been abandoned, so an untouched row never implies
       * a habit nobody has. The share is of the hands actually faced — those
       * played plus those left — because that is the question it answers: how
       * often a hand gets walked away from rather than decided.
       */}
      {summary.skippedHands === 0
        ? null
        : renderMeasure(
            "Hands skipped",
            hasToday
              ? countAndShare(summary.todaySkippedHands, facedToday)
              : null,
            countAndShare(summary.skippedHands, faced),
          )}
    </div>
  );
}
