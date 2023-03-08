import { Combination, PowerSet } from "js-combinatorics";
import { CARDS_PER_DISCARD } from "../cribbage";
import { Calculation } from "./Calculation";
import { DealtCard } from "../DealtCard";
import React from "react";

const POINTS = {
  FIFTEENS: 2,
  FOUR_CARD_RUN: 4,
  PAIR: 2,
  THREE_CARD_RUN: 3,
} as const;

const COUNT = {
  FIFTEEN: 15,
} as const;

function getAllKeepDiscardCombinations(dealtCards: DealtCard[]) {
  return [...new Combination(dealtCards, CARDS_PER_DISCARD)].map((discard) => ({
    discard,
    keep: dealtCards.filter((card) => !discard.includes(card)),
  }));
}

const CARD_COUNTS = {
  FIFTEEN: 2,
  FOUR_RUN: 4,
  PAIR: 2,
  THREE_RUN: 3,
} as const;

const pairsPoints = (keep: DealtCard[]) =>
  [...new Combination(keep, CARD_COUNTS.PAIR)].filter(
    (possiblePair) =>
      (possiblePair[0] as DealtCard).rankValue ===
      (possiblePair[1] as DealtCard).rankValue
  ).length * POINTS.PAIR;

const fifteensPoints = (keep: DealtCard[]) =>
  [...new PowerSet(keep)].filter(
    (possibleFifteen) =>
      possibleFifteen
        .map((card) => card.count)
        .reduce((count1, count2) => count1 + count2, 0) === COUNT.FIFTEEN
  ).length * POINTS.FIFTEENS;

// TODO: zip with itself better: https://stackoverflow.com/questions/22015684/zip-arrays-in-javascript
// e.g. a=[2,3,4]; a.slice(1).map((e, i) => e - a[i]).every((diff) => diff === 1) // true
const threeRunPoints = (keep: DealtCard[]) =>
  [...new Combination(keep, CARD_COUNTS.THREE_RUN)]
    .map((possibleThreeRun) => {
      possibleThreeRun.sort(
        (card1, card2) => card1.rankValue - card2.rankValue
      );
      return possibleThreeRun;
    })
    .filter(
      (possibleThreeRun) =>
        (possibleThreeRun[0] as DealtCard).rankValue + 1 ===
          (possibleThreeRun[1] as DealtCard).rankValue &&
        (possibleThreeRun[1] as DealtCard).rankValue + 1 ===
          (possibleThreeRun[2] as DealtCard).rankValue
    ).length * POINTS.THREE_CARD_RUN;

// TODO: zip with itself better: https://stackoverflow.com/questions/22015684/zip-arrays-in-javascript
// TODO: factor out common code with threeRunPoints if it exists post-zip().
const fourRunPoints = (keep: DealtCard[]) =>
  [...new Combination(keep, CARD_COUNTS.FOUR_RUN)]
    .map((possibleFourRun) => {
      possibleFourRun.sort((card1, card2) => card1.rankValue - card2.rankValue);
      return possibleFourRun;
    })
    .filter(
      (possibleFourRun) =>
        (possibleFourRun[0] as DealtCard).rankValue + 1 ===
          (possibleFourRun[1] as DealtCard).rankValue &&
        (possibleFourRun[1] as DealtCard).rankValue + 1 ===
          (possibleFourRun[2] as DealtCard).rankValue &&
        (possibleFourRun[2] as DealtCard).rankValue + 1 ===
          (possibleFourRun[3] as DealtCard).rankValue
    ).length * POINTS.FOUR_CARD_RUN;

const countPoints = (keep: DealtCard[]) =>
  pairsPoints(keep) +
  fifteensPoints(keep) +
  (fourRunPoints(keep) || threeRunPoints(keep));

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
              .map((dealtCard) => dealtCard.dealOrder)
              .join("")}
            points={scoredKeepDiscard.points}
          />
        ))}
    </div>
  );
}
