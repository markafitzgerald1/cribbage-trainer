import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import type { ComparableCard } from "../ui/sortCards";
import { PossibleHand } from "./PossibleHand";
import { SortOrder } from "../ui/SortOrder";

interface ScoredPossibleKeepDiscardProps {
  readonly keep: readonly ComparableCard[];
  readonly discard: readonly ComparableCard[];
  readonly points: number;
  readonly sortOrder: SortOrder;
}

export function ScoredPossibleKeepDiscard({
  keep,
  discard,
  points,
  sortOrder,
}: ScoredPossibleKeepDiscardProps) {
  return (
    <li className={classes.scoredPossibleKeepDiscard}>
      <span className={classes.keepColumn}>
        <PossibleHand
          dealtCards={keep}
          sortOrder={sortOrder}
        />
      </span>
      <span className={classes.discardColumn}>
        <PossibleHand
          dealtCards={discard}
          sortOrder={sortOrder}
        />
      </span>
      <span className={classes.pointsColumn}>{points}</span>
    </li>
  );
}
