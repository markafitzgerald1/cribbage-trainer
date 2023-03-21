import { CalculationsProps } from "./Calculations";
import { DealtCard } from "../DealtCard";
import React from "react";
import { SortOrder } from "../SortOrder";
import { sort } from "../sortCards";

export function handToString(dealtCards: DealtCard[], sortOrder: SortOrder) {
  return sort(dealtCards, sortOrder)
    .map((dealtCard) => dealtCard.rankLabel)
    .join("");
}

export function PossibleHand({ dealtCards, sortOrder }: CalculationsProps) {
  return (
    <span className="keep-discard">{handToString(dealtCards, sortOrder)}</span>
  );
}
