import { Combination, PowerSet } from "js-combinatorics";
import { CARDS_PER_DISCARD } from "../cribbage";
import { Calculation } from "./Calculation";
/* jscpd:ignore-start */
import { DealtCard } from "../DealtCard";
import React from "react";
import { SortOrder } from "../SortOrder";
/* jscpd:ignore-end */
import { pairsPoints } from "../Scoring";

const COUNT = {
  FIFTEEN: 15,
} as const;

function getAllKeepDiscardCombinations(dealtCards: DealtCard[]) {
  return [...new Combination(dealtCards, CARDS_PER_DISCARD)].map((discard) => ({
    discard,
    keep: dealtCards.filter((card) => !discard.includes(card)),
  }));
}

const PLAY_POINTS = {
  FIFTEEN_COUNT: 2,
  FOUR_RUN: 4,
  RUN_PER_CARD: 1,
  THREE_RUN: 3,
} as const;

const fifteensPoints = (keep: DealtCard[]) =>
  [...new PowerSet(keep)].filter(
    (possibleFifteen) =>
      possibleFifteen
        .map((card) => card.count)
        .reduce((count1, count2) => count1 + count2, 0) === COUNT.FIFTEEN
  ).length * PLAY_POINTS.FIFTEEN_COUNT;

enum RunLength {
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

const runPoints = (keep: DealtCard[], runLength: RunLength) =>
  [...new Combination(keep, runLength)]
    .map((combination) => combination.map((card) => card.rankValue))
    .map((combination) =>
      [...combination].sort((rank1, rank2) => rank1 - rank2)
    )
    .filter((combination) =>
      combination
        .slice(1)
        .map((rank, index) => rank - combination[index]!)
        .every((diff) => diff === 1)
    ).length *
  PLAY_POINTS.RUN_PER_CARD *
  runLength;

const countPoints = (keep: DealtCard[]) =>
  pairsPoints(keep) +
  fifteensPoints(keep) +
  (runPoints(keep, RunLength.FOUR) || runPoints(keep, RunLength.THREE));

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
