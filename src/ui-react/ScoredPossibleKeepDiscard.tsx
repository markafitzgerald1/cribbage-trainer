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
  return (
    <div
      role="row"
      style={{ display: "contents" }}
    >
      <div
        className={classes.cell}
        role="cell"
      >
        <PossibleHand
          dealtCards={keep}
          sortOrder={sortOrder}
        />
      </div>
      <div
        className={classes.cell}
        role="cell"
      >
        <PossibleHand
          dealtCards={discard}
          sortOrder={sortOrder}
        />
      </div>
      <div
        className={[classes.cell, classes.numeric].join(" ")}
        role="cell"
      >
        {handPoints}
      </div>
      <div
        className={[classes.cell, classes.numeric].join(" ")}
        role="cell"
      >
        {(expectedHandPoints - handPoints).toFixed(
          EXPECTED_POINTS_FRACTION_DIGITS,
        )}
      </div>
      <div
        className={[classes.cell, classes.numeric].join(" ")}
        role="cell"
      >
        {expectedHandPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}
      </div>
    </div>
  );
}
