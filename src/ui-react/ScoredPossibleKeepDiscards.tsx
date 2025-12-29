import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByExpectedScoreDescending } from "../analysis/analysis";

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
      <figcaption>Post-Starter Points</figcaption>
      <ul>
        <li className={classes.columnHeaders}>
          <span>Keep + Discard</span>
          <span>Pre-cut points</span>
          <span>From cut (avg)</span>
          <span>Total (avg)</span>
        </li>
        {allScoredKeepDiscardsByExpectedScoreDescending(dealtCards).map(
          (scoredKeepDiscard) => (
            <ScoredPossibleKeepDiscard
              discard={scoredKeepDiscard.discard}
              expectedHandPoints={scoredKeepDiscard.expectedHandPoints}
              handPoints={scoredKeepDiscard.handPoints}
              keep={scoredKeepDiscard.keep}
              key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
                .map((dealtCard) => dealtCard.dealOrder)
                .join("")}
              sortOrder={sortOrder}
            />
          ),
        )}
      </ul>
    </figure>
  );
}
