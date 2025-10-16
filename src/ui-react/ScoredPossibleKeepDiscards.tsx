import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByScoreDescending } from "../analysis/analysis";

export interface ScoredPossibleKeepDiscardsProps {
  readonly dealtCards: readonly DealtCard[];
  readonly sortOrder: SortOrder;
}

export function ScoredPossibleKeepDiscards({
  dealtCards,
  sortOrder,
}: ScoredPossibleKeepDiscardsProps) {
  return (
    <figure className={classes.scoredPossibleKeepDiscards}>
      <figcaption>Pre-Cut Scores</figcaption>
      <div className={classes.tableHeader}>
        <span className={classes.keepHeader}>Keep</span>
        <span className={classes.discardHeader}>Discard</span>
        <span className={classes.pointsHeader}>Pre-Cut Hand Points</span>
      </div>
      <ul>
        {allScoredKeepDiscardsByScoreDescending(dealtCards).map(
          (scoredKeepDiscard) => (
            <ScoredPossibleKeepDiscard
              discard={scoredKeepDiscard.discard}
              keep={scoredKeepDiscard.keep}
              key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
                .map((dealtCard) => dealtCard.dealOrder)
                .join("")}
              points={scoredKeepDiscard.points}
              sortOrder={sortOrder}
            />
          ),
        )}
      </ul>
    </figure>
  );
}
