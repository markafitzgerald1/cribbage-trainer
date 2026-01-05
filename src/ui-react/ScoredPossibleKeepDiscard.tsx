import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import type { ComparableCard } from "../ui/sortCards";
import { PossibleHand } from "./PossibleHand";
import { SortOrder } from "../ui/SortOrder";
import { useState } from "react";

interface ScoredPossibleKeepDiscardProps {
  readonly keep: readonly ComparableCard[];
  readonly discard: readonly ComparableCard[];
  readonly handPoints: number;
  readonly expectedHandPoints: number;
  readonly avgCutAdded15s: number;
  readonly avgCutAddedPairs: number;
  readonly avgCutAddedRuns: number;
  readonly sortOrder: SortOrder;
  readonly isHighlighted: boolean;
}

const EXPECTED_POINTS_FRACTION_DIGITS = 2;

export function ScoredPossibleKeepDiscard({
  keep,
  discard,
  handPoints,
  expectedHandPoints,
  avgCutAdded15s,
  avgCutAddedPairs,
  avgCutAddedRuns,
  sortOrder,
  isHighlighted,
}: ScoredPossibleKeepDiscardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRowClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <tr
        className={`${classes.scoredPossibleKeepDiscard} ${
          isHighlighted ? classes.highlighted : ""
        } ${classes.clickable}`}
        onClick={handleRowClick}
      >
        <td>
          <PossibleHand
            dealtCards={keep}
            sortOrder={sortOrder}
          />{" "}
          (
          <PossibleHand
            dealtCards={discard}
            sortOrder={sortOrder}
          />
          )
        </td>
        <td>{handPoints}</td>
        <td>
          {(expectedHandPoints - handPoints).toFixed(
            EXPECTED_POINTS_FRACTION_DIGITS,
          )}
        </td>
        <td>{expectedHandPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}</td>
      </tr>
      {isExpanded && (
        <tr
          className={classes.expandedRow}
          onClick={handleRowClick}
        >
          <td colSpan={4}>
            <div className={classes.breakdownContainer}>
              <div className={classes.breakdownItem}>
                <span className={classes.breakdownLabel}>
                  Expected cut-added 15s:
                </span>
                <span className={classes.breakdownValue}>
                  {avgCutAdded15s.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} pts
                </span>
              </div>
              <div className={classes.breakdownItem}>
                <span className={classes.breakdownLabel}>
                  Expected cut-added pairs:
                </span>
                <span className={classes.breakdownValue}>
                  {avgCutAddedPairs.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}{" "}
                  pts
                </span>
              </div>
              <div className={classes.breakdownItem}>
                <span className={classes.breakdownLabel}>
                  Expected cut-added runs:
                </span>
                <span className={classes.breakdownValue}>
                  {avgCutAddedRuns.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} pts
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
