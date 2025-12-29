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
      <div className={classes.grid} role="table" aria-label="Post-Starter Points">
        <div className={classes.header} role="columnheader">Keep</div>
        <div className={classes.header} role="columnheader">Discard</div>
        <div className={[classes.header, classes.numeric].join(" ")} role="columnheader">Pre-cut</div>
        <div className={[classes.header, classes.numeric].join(" ")} role="columnheader">From cut</div>
        <div className={[classes.header, classes.numeric].join(" ")} role="columnheader">Total</div>

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
      </div>
    </figure>
  );
}
