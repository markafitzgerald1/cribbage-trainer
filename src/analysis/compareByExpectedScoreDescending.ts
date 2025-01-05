import { Card } from "../game/Card";
import { ScoredKeepDiscard } from "./analysis";

export const compareByExpectedScoreDescending = (
  discardKeep1: ScoredKeepDiscard<Card>,
  discardKeep2: ScoredKeepDiscard<Card>,
): number => {
  if (discardKeep2.expectedHandPoints !== discardKeep1.expectedHandPoints) {
    return discardKeep2.expectedHandPoints - discardKeep1.expectedHandPoints;
  }
  if (discardKeep2.handPoints !== discardKeep1.handPoints) {
    return discardKeep2.handPoints - discardKeep1.handPoints;
  }
  if (discardKeep2.keep[0]?.rank !== discardKeep1.keep[0]?.rank) {
    return (
      (discardKeep2.keep[0]?.rank ?? 0) - (discardKeep1.keep[0]?.rank ?? 0)
    );
  }
  return (discardKeep2.keep[1]?.rank ?? 0) - (discardKeep1.keep[1]?.rank ?? 0);
};
