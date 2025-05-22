// src/ui-react/ScoredPossibleKeepDiscard.tsx
import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import { ComparableCard } from "../ui/sortCards"; // Assuming this is the correct path
import { PossibleHand } from "./PossibleHand";    // Assuming this is the correct path
import { SortOrder } from "../ui/SortOrder";      // Assuming this is the correct path
import { useState, useCallback } from "react";

interface ScoredPossibleKeepDiscardProps {
  readonly keep: readonly ComparableCard[];
  readonly discard: readonly ComparableCard[];
  readonly handPoints: number;
  readonly expectedHandPoints: number; // This is the total average
  readonly sortOrder: SortOrder;
}

const EXPECTED_POINTS_FRACTION_DIGITS = 2;

export function ScoredPossibleKeepDiscard({
  keep,
  discard,
  handPoints,
  expectedHandPoints,
  sortOrder,
}: ScoredPossibleKeepDiscardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpansion = useCallback(() => {
    setIsExpanded(prevExpanded => !prevExpanded);
  }, []);

  const averageCutPoints = expectedHandPoints - handPoints;

  return (
    <li
      className={classes.scoredPossibleKeepDiscardItem} // Use a specific class for the item
      onClick={toggleExpansion}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleExpansion()}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
    >
      <div className={classes.summaryRow}>
        <span className={classes.handDisplay}>
          <PossibleHand dealtCards={keep} sortOrder={sortOrder} /> (
          <PossibleHand dealtCards={discard} sortOrder={sortOrder} />)
        </span>
        <span className={classes.totalPointsDisplay}>
          = {expectedHandPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}
        </span>
        <span className={classes.chevronIcon}>{isExpanded ? "▼" : "▶"}</span>
      </div>
      {isExpanded && (
        <div className={classes.detailsView}>
          &nbsp;&nbsp;└─ Breakdown: {handPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} (hand) +{" "}
          {averageCutPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} (avg. cut)
        </div>
      )}
    </li>
  );
}
