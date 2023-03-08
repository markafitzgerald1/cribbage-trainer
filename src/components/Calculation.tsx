import { DealtCard } from "../DealtCard";
import React from "react";

type ScoredKeepDiscard = {
  keep: DealtCard[];
  discard: DealtCard[];
  points: number;
};

export function handToString(dealtCards: DealtCard[]) {
  return dealtCards.map((dealtCard) => dealtCard.rankLabel).join("");
}

export function Calculation({ keep, discard, points }: ScoredKeepDiscard) {
  return (
    <div>
      <span className="keep-discard">{handToString(keep)}</span>
      <span>-</span>
      <span className="keep-discard">{handToString(discard)}</span> for {points}{" "}
      points
    </div>
  );
}
