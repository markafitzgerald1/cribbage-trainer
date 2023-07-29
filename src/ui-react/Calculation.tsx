import { DealtCard } from "../game/DealtCard";
import { PossibleHand } from "./PossibleHand";
import React from "react";
import { SortOrder } from "../ui/SortOrder";

interface CalculationProps {
  readonly keep: readonly DealtCard[];
  readonly discard: readonly DealtCard[];
  readonly points: number;
  readonly sortOrder: SortOrder;
}

export function Calculation({
  keep,
  discard,
  points,
  sortOrder,
}: CalculationProps) {
  return (
    <li>
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
    </li>
  );
}
