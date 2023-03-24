import { fifteensPoints, pairsPoints, runsPoints } from "../Scoring";
import { CARDS_PER_DISCARD } from "../cribbage";
import { Calculation } from "./Calculation";
import { Combination } from "js-combinatorics";
/* jscpd:ignore-start */
import { DealtCard } from "../DealtCard";
import React from "react";
import { SortOrder } from "../SortOrder";
/* jscpd:ignore-end */

function getAllKeepDiscardCombinations(dealtCards: DealtCard[]) {
  return [...new Combination(dealtCards, CARDS_PER_DISCARD)].map((discard) => ({
    discard,
    keep: dealtCards.filter((card) => !discard.includes(card)),
  }));
}

const countPoints = (keep: DealtCard[]) =>
  pairsPoints(keep) + fifteensPoints(keep) + runsPoints(keep);

export interface CalculationsProps {
  dealtCards: DealtCard[];
  sortOrder: SortOrder;
}

export function Calculations({ dealtCards, sortOrder }: CalculationsProps) {
  return (
    <div className="calculations">
      {getAllKeepDiscardCombinations(dealtCards)
        .map((keepDiscard) => ({
          discard: keepDiscard.discard,
          keep: keepDiscard.keep,
          points: countPoints(keepDiscard.keep),
        }))
        .sort((card1, card2) => card2.points - card1.points)
        .map((scoredKeepDiscard) => (
          <Calculation
            discard={scoredKeepDiscard.discard}
            keep={scoredKeepDiscard.keep}
            key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
              .map((dealtCard) => dealtCard.dealOrder)
              .join("")}
            points={scoredKeepDiscard.points}
            sortOrder={sortOrder}
          />
        ))}
    </div>
  );
}
