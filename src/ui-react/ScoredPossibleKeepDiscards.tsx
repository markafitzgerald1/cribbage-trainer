import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import { DealtCard } from "../game/DealtCard";
/* jscpd:ignore-start */
import React from "react";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
/* jscpd:ignore-end */
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
      <figcaption>Pre-cut hand</figcaption>
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
