/* jscpd:ignore-start */
import { DealtCard } from "../DealtCard";
import { PossibleHand } from "./PossibleHand";
import React from "react";
import { SortOrder } from "../SortOrder";
/* jscpd:ignore-end */

interface ScoredKeepDiscard {
  keep: DealtCard[];
  discard: DealtCard[];
  points: number;
  sortOrder: SortOrder;
}

export function Calculation({
  keep,
  discard,
  points,
  sortOrder,
}: ScoredKeepDiscard) {
  return (
    <div>
      <PossibleHand
        dealtCards={keep}
        sortOrder={sortOrder}
      />
      <span>-</span>
      <PossibleHand
        dealtCards={discard}
        sortOrder={sortOrder}
      />{" "}
      for {points} points
    </div>
  );
}
