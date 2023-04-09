import { DealtCard } from "../DealtCard";
import { PossibleHand } from "./PossibleHand";
import React from "react";
import { SortOrder } from "../SortOrder";

interface CalculationProps {
  keep: readonly DealtCard[];
  discard: readonly DealtCard[];
  points: number;
  sortOrder: SortOrder;
}

export function Calculation({
  keep,
  discard,
  points,
  sortOrder,
}: CalculationProps) {
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
