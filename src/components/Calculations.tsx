import { Calculation } from "./Calculation";
import { DealtCard } from "../DealtCard";
import React from "react";
import { SortOrder } from "../SortOrder";
import { allScoredKeepDiscardsByScoreDescending } from "../analysis";

export interface CalculationsProps {
  dealtCards: DealtCard[];
  sortOrder: SortOrder;
}

export function Calculations({ dealtCards, sortOrder }: CalculationsProps) {
  return (
    <div className="calculations">
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
    </div>
  );
}
