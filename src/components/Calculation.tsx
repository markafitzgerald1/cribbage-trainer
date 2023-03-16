import { DealtCard } from "../DealtCard";
import React from "react";
import { SortOrder } from "../SortOrder";
import { compare } from "../sortCards";

interface ScoredKeepDiscard {
  keep: DealtCard[];
  discard: DealtCard[];
  points: number;
  sortOrder: SortOrder;
}

export function handToString(dealtCards: DealtCard[], sortOrder: SortOrder) {
  return [...dealtCards]
    .sort(compare[SortOrder[sortOrder]])
    .map((dealtCard) => dealtCard.rankLabel)
    .join("");
}

export function Calculation({
  keep,
  discard,
  points,
  sortOrder,
}: ScoredKeepDiscard) {
  return (
    <div>
      <span className="keep-discard">{handToString(keep, sortOrder)}</span>
      <span>-</span>
      <span className="keep-discard">
        {handToString(discard, sortOrder)}
      </span>{" "}
      for {points} points
    </div>
  );
}
