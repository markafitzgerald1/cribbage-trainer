import { Calculation } from "./Calculation";
import { DealtCard } from "../game/DealtCard";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByScoreDescending } from "../analysis/analysis";

export interface CalculationsProps {
  dealtCards: readonly DealtCard[];
  sortOrder: SortOrder;
}

export function Calculations({ dealtCards, sortOrder }: CalculationsProps) {
  return (
    <figure>
      <figcaption>Pre-cut hand points:</figcaption>
      <ul className="calculations">
        {allScoredKeepDiscardsByScoreDescending(dealtCards).map(
          (scoredKeepDiscard) => (
            <Calculation
              discard={scoredKeepDiscard.discard}
              keep={scoredKeepDiscard.keep}
              key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
                .map((dealtCard) => dealtCard.dealOrder)
                .join("")}
              points={scoredKeepDiscard.points}
              sortOrder={sortOrder}
            />
          )
        )}
      </ul>
    </figure>
  );
}
