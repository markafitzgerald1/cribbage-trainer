import { DealtCard } from "./DealtCard";
import { KeepDiscard } from "./KeepDiscard";
import React from "react";

type ScoredKeepDiscard = KeepDiscard & { points: number };

export function handToString(dealtCards: DealtCard[]) {
  return dealtCards.map((dealtCard) => dealtCard.rankLabel).join("");
}

export class Calculation extends React.Component<{
  scoredKeepDiscard: ScoredKeepDiscard;
}> {
  override render() {
    const {
      scoredKeepDiscard: { keep, discard, points },
    } = this.props;
    return (
      <div>
        <span className="keep-discard">{handToString(keep)}</span>-
        <span className="keep-discard">{handToString(discard)}</span> for{" "}
        {points} points
      </div>
    );
  }
}
