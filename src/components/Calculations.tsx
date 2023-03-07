import { Calculation } from "./Calculation";
import { Combination } from "js-combinatorics";
import { DealtCard } from "../DealtCard";
import React from "react";

const POINTS = {
  FIFTEENS: 2,
  FOUR_CARD_RUN: 4,
  PAIR: 2,
  THREE_CARD_RUN: 3,
} as const;

export const COUNT = {
  FIFTEEN: 15,
} as const;

function getAllKeepDiscardCombinations(dealtCards: DealtCard[]) {
  return [...new Set([...new Combination(dealtCards, 2)])].map((discard) => ({
    discard,
    keep: dealtCards.filter(
      (_, index) =>
        index !== (discard[0] as DealtCard).index &&
        index !== (discard[1] as DealtCard).index
    ),
  }));
}

function countPoints(keep: DealtCard[]) {
  let ans = 0;
  const keepCopy = [...keep].sort(
    (first, second) => first.rankValue - second.rankValue
  );

  let threeRuns = 0;
  let fourRuns = 0;
  for (let index1 = 0; index1 < keepCopy.length; index1 += 1) {
    const card1 = keepCopy[index1] as DealtCard;
    for (let index2 = index1 + 1; index2 < keepCopy.length; index2 += 1) {
      const card2 = keepCopy[index2] as DealtCard;
      if (card1.rankValue === card2.rankValue) {
        ans += POINTS.PAIR;
      }
      if (card1.count + card2.count === COUNT.FIFTEEN) {
        ans += POINTS.FIFTEENS;
      }
      for (let index3 = index2 + 1; index3 < keepCopy.length; index3 += 1) {
        const card3 = keepCopy[index3] as DealtCard;
        if (card1.count + card2.count + card3.count === COUNT.FIFTEEN) {
          ans += POINTS.FIFTEENS;
        }
        if (
          card1.rankValue + 1 === card2.rankValue &&
          card2.rankValue + 1 === card3.rankValue
        ) {
          threeRuns += 1;
        }
        for (let index4 = index3 + 1; index4 < keepCopy.length; index4 += 1) {
          const card4 = keepCopy[index4] as DealtCard;
          if (
            card1.count + card2.count + card3.count + card4.count ===
            COUNT.FIFTEEN
          ) {
            ans += POINTS.FIFTEENS;
          }
          if (
            card1.rankValue + 1 === card2.rankValue &&
            card2.rankValue + 1 === card3.rankValue &&
            card3.rankValue + 1 === card4.rankValue
          ) {
            fourRuns += 1;
          }
        }
      }
    }
  }

  if (fourRuns) {
    ans += fourRuns * POINTS.FOUR_CARD_RUN;
  } else if (threeRuns) {
    ans += threeRuns * POINTS.THREE_CARD_RUN;
  }

  return ans;
}

export function Calculations({ dealtCards }: { dealtCards: DealtCard[] }) {
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
              .map((dealtCard) => dealtCard.rankLabel)
              .join("")}
            points={scoredKeepDiscard.points}
          />
        ))}
    </div>
  );
}
