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
   * A browser that has completed no discards has nothing to average, and a
   * zero here would read as perfect play rather than as no evidence.
   */
  if (summary.meanExpectedPointsLoss === null) {
    return null;
  }
  const hasToday = summary.todayDecisions > 0;
  const columns = hasToday ? classes.withToday : classes.allTimeOnly;
  return (
    <div className={`${classes.tally} ${columns}`}>
      <span />
      {hasToday ? <span className={classes.period}>today</span> : null}
      <span className={classes.period}>all time</span>
      {renderMeasure(
        "Points lost per discard",
        summary.todayMeanExpectedPointsLoss === null
          ? null
          : summary.todayMeanExpectedPointsLoss.toFixed(LOSS_FRACTION_DIGITS),
        summary.meanExpectedPointsLoss.toFixed(LOSS_FRACTION_DIGITS),
      )}
      {renderMeasure(
        "Best choice",
        hasToday
          ? countAndShare(summary.todayOptimalDecisions, summary.todayDecisions)
          : null,
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
              ? countAndShare(
                  summary.todaySkippedHands,
                  summary.todayDecisions + summary.todaySkippedHands,
                )
              : null,
            countAndShare(
              summary.skippedHands,
              summary.decisions + summary.skippedHands,
            ),
          )}
    </div>
  );
}
