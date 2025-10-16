import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import type { ComparableCard } from "../ui/sortCards";
import { PossibleHand } from "./PossibleHand";
import { SortOrder } from "../ui/SortOrder";

interface ScoredPossibleKeepDiscardProps {
  readonly keep: readonly ComparableCard[];
  readonly discard: readonly ComparableCard[];
  readonly handPoints: number;
  readonly expectedHandPoints: number;
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
  const additionalPoints = expectedHandPoints - handPoints;
  return (
    <li className={classes.scoredPossibleKeepDiscard}>
      <PossibleHand
        dealtCards={keep}
        sortOrder={sortOrder}
      />{" "}
      (
      <PossibleHand
        dealtCards={discard}
        sortOrder={sortOrder}
      />
      ) = pre-cut: {handPoints} + from cut:{" "}
      {additionalPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} = total:{" "}
      {expectedHandPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}
    </li>
  );
}
