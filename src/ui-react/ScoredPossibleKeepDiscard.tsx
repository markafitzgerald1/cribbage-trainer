import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import * as parentClasses from "./ScoredPossibleKeepDiscards.module.css";
import {
  type ScoredPossibleKeepDiscardCribDetailsProps,
  ScoredPossibleKeepDiscardExpandedRow,
} from "./ScoredPossibleKeepDiscardExpandedRow";
import { useCallback, useState } from "react";
import type { BreakdownProps } from "./BreakdownProps";
import type { ComparableCard } from "../ui/sortCards";
import { PossibleHand } from "./PossibleHand";
import { SortOrder } from "../ui/SortOrder";

interface ScoredPossibleKeepDiscardProps
  extends
    BreakdownProps,
    ScoredPossibleKeepDiscardCribDetailsProps<ComparableCard> {
  readonly expectedHandPoints: number;
  readonly expectedNetPoints: number;
  readonly signedExpectedCribPoints: number;
  readonly sortOrder: SortOrder;
  readonly isHighlighted: boolean;
  readonly rowIndex: number;
}

const EXPECTED_POINTS_FRACTION_DIGITS = 2;
const ROW_STRIPE_DIVISOR = 2;

const formatSignedExpectedPoints = (points: number): string => {
  const formatted = points.toFixed(EXPECTED_POINTS_FRACTION_DIGITS);

  return points > 0 ? `+${formatted}` : formatted;
};

export function ScoredPossibleKeepDiscard({
  keep,
  discard,
  handPointsBreakdown,
  expectedCribPointBreakdown,
  expectedCribPoints,
  expectedHandPoints,
  expectedNetPoints,
  signedExpectedCribPoints,
  cribStarterPoints,
  avgCutAdded15s,
  avgCutAddedPairs,
  avgCutAddedRuns,
  avgCutAddedFlushes,
  avgCutAddedNobs,
  flushesContributions,
  nobsContributions,
  cutCountsRemaining,
  fifteensContributions,
  pairsContributions,
  runsContributions,
  sortOrder,
  isHighlighted,
  rowIndex,
}: ScoredPossibleKeepDiscardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRowClick = useCallback(() => {
    setIsExpanded((expanded) => !expanded);
  }, []);

  const handExpectedTotal = expectedHandPoints.toFixed(
    EXPECTED_POINTS_FRACTION_DIGITS,
  );
  const cribExpectedTotal = formatSignedExpectedPoints(
    signedExpectedCribPoints,
  );
  const netExpectedTotal = expectedNetPoints.toFixed(
    EXPECTED_POINTS_FRACTION_DIGITS,
  );
  const rowStripeClass =
    rowIndex % ROW_STRIPE_DIVISOR === 0
      ? parentClasses.oddRow
      : parentClasses.evenRow;
  const renderHandDiscardCell = () => (
    <span className={classes.handDiscardCell}>
      <PossibleHand
        dealtCards={keep}
        sortOrder={sortOrder}
      />
      <span className={classes.discardGroup}>
        (
        <PossibleHand
          dealtCards={discard}
          sortOrder={sortOrder}
        />
        )
      </span>
    </span>
  );

  return (
    <>
      <tr
        className={`${classes.scoredPossibleKeepDiscard} ${rowStripeClass} ${
          isHighlighted ? classes.highlighted : ""
        } ${classes.clickable}`}
        onClick={handleRowClick}
      >
        <td>{renderHandDiscardCell()}</td>
        <td className={classes.scoreCell}>{handExpectedTotal}</td>
        <td className={classes.scoreCell}>{cribExpectedTotal}</td>
        <td className={classes.netScoreCell}>
          <span className={classes.netPointsCell}>
            <span>{netExpectedTotal}</span>
            <span
              className={`${classes.expandIndicator} ${
                isExpanded ? classes.expandIndicatorExpanded : ""
              }`}
            >
              ▸
            </span>
          </span>
        </td>
      </tr>
      {isExpanded ? (
        <ScoredPossibleKeepDiscardExpandedRow
          avgCutAdded15s={avgCutAdded15s}
          avgCutAddedFlushes={avgCutAddedFlushes}
          avgCutAddedNobs={avgCutAddedNobs}
          avgCutAddedPairs={avgCutAddedPairs}
          avgCutAddedRuns={avgCutAddedRuns}
          cribStarterPoints={cribStarterPoints}
          cutCountsRemaining={cutCountsRemaining}
          discard={discard}
          expectedCribPointBreakdown={expectedCribPointBreakdown}
          expectedCribPoints={expectedCribPoints}
          fifteensContributions={fifteensContributions}
          flushesContributions={flushesContributions}
          handPointsBreakdown={handPointsBreakdown}
          keep={keep}
          nobsContributions={nobsContributions}
          pairsContributions={pairsContributions}
          runsContributions={runsContributions}
          sortOrder={sortOrder}
        />
      ) : null}
    </>
  );
}
