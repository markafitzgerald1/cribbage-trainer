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
  for (
    let keepIndex = 0;
    keepIndex < Math.min(discardKeep1.keep.length, discardKeep2.keep.length);
    keepIndex += 1
  ) {
    if (
      // eslint-disable-next-line security/detect-object-injection
      discardKeep2.keep[keepIndex]?.rank !== discardKeep1.keep[keepIndex]?.rank
    ) {
      return (
        // eslint-disable-next-line security/detect-object-injection
        (discardKeep2.keep[keepIndex]?.rank ?? 0) -
        // eslint-disable-next-line security/detect-object-injection
        (discardKeep1.keep[keepIndex]?.rank ?? 0)
      );
    }
  }
  return 0;
};
