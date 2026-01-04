import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import type { ComparableCard } from "../ui/sortCards";
import { PossibleHand } from "./PossibleHand";
import { SortOrder } from "../ui/SortOrder";

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
  return (
    <tr
      className={`${classes.scoredPossibleKeepDiscard} ${
        isHighlighted ? classes.highlighted : ""
      }`}
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
      <td>{avgCutAdded15s.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}</td>
      <td>{avgCutAddedPairs.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}</td>
      <td>{avgCutAddedRuns.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}</td>
      <td>{expectedHandPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}</td>
    </tr>
  );
}
