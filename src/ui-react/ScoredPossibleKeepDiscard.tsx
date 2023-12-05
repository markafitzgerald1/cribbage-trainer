import { DealtCard } from "../game/DealtCard";
import { PossibleHand } from "./PossibleHand";
import React from "react";
import { SortOrder } from "../ui/SortOrder";

interface ScoredPossibleKeepDiscardProps {
  readonly keep: readonly DealtCard[];
  readonly discard: readonly DealtCard[];
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
    <li>
      <PossibleHand
        dealtCards={keep}
        sortOrder={sortOrder}
      />{" "}
      (
      <PossibleHand
        dealtCards={discard}
        sortOrder={sortOrder}
      />
      ) = {points} points
    </li>
  );
}
