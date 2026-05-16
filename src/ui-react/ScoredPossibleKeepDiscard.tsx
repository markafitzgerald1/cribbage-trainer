import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import * as parentClasses from "./ScoredPossibleKeepDiscards.module.css";
import { useCallback, useState } from "react";
import type { BreakdownProps } from "./BreakdownProps";
import type { ComparableCard } from "../ui/sortCards";
import type { HandPoints } from "../game/handPoints";
import { PossibleHand } from "./PossibleHand";
import { ScoredPossibleKeepDiscardExpandedRow } from "./ScoredPossibleKeepDiscardExpandedRow";
import { SortOrder } from "../ui/SortOrder";

interface ScoredPossibleKeepDiscardProps extends BreakdownProps {
  readonly keep: readonly ComparableCard[];
  readonly discard: readonly ComparableCard[];
  readonly handPoints: number;
  readonly handPointsBreakdown: HandPoints;
  readonly expectedHandPoints: number;
  readonly sortOrder: SortOrder;
  readonly isHighlighted: boolean;
  readonly rowIndex: number;
}

const EXPECTED_POINTS_FRACTION_DIGITS = 2;
const ROW_STRIPE_DIVISOR = 2;

export function ScoredPossibleKeepDiscard({
  keep,
  discard,
  handPoints,
  handPointsBreakdown,
  expectedHandPoints,
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

  const diff = (expectedHandPoints - handPoints).toFixed(
    EXPECTED_POINTS_FRACTION_DIGITS,
  );
  const total = expectedHandPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS);
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
        <td>{handPoints}</td>
        <td>
          <span className={classes.cutPointsCell}>
            <span>{diff}</span>
            <span
              className={`${classes.expandIndicator} ${
                isExpanded ? classes.expandIndicatorExpanded : ""
              }`}
            >
              ▸
            </span>
          </span>
        </td>
        <td>{total}</td>
      </tr>
      {isExpanded ? (
        <ScoredPossibleKeepDiscardExpandedRow
          avgCutAdded15s={avgCutAdded15s}
          avgCutAddedFlushes={avgCutAddedFlushes}
          avgCutAddedNobs={avgCutAddedNobs}
          avgCutAddedPairs={avgCutAddedPairs}
          avgCutAddedRuns={avgCutAddedRuns}
          cutCountsRemaining={cutCountsRemaining}
          discard={discard}
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
