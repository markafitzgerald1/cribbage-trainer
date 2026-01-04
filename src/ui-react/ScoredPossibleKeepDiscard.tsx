import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import type { ComparableCard } from "../ui/sortCards";
import { PossibleHand } from "./PossibleHand";
import { SortOrder } from "../ui/SortOrder";

interface ScoredPossibleKeepDiscardProps {
  readonly keep: readonly ComparableCard[];
  readonly discard: readonly ComparableCard[];
  readonly handPoints: number;
  readonly expectedHandPoints: number;
  readonly expectedCutAddedFifteens: number;
  readonly expectedCutAddedPairs: number;
  readonly expectedCutAddedRuns: number;
  readonly sortOrder: SortOrder;
  readonly isHighlighted: boolean;
}

const EXPECTED_POINTS_FRACTION_DIGITS = 2;

export function ScoredPossibleKeepDiscard({
  keep,
  discard,
  handPoints,
  expectedHandPoints,
  expectedCutAddedFifteens,
  expectedCutAddedPairs,
  expectedCutAddedRuns,
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
      <td>{expectedCutAddedFifteens.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}</td>
      <td>{expectedCutAddedPairs.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}</td>
      <td>{expectedCutAddedRuns.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}</td>
      <td>{expectedHandPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}</td>
    </tr>
  );
}
