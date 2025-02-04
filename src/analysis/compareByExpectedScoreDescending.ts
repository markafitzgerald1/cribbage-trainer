import { Card } from "../game/Card";
import { ScoredKeepDiscard } from "./analysis";

export const compareByExpectedScoreThenRankDescending = (
  discardKeep1: ScoredKeepDiscard<Card>,
  discardKeep2: ScoredKeepDiscard<Card>,
): number => {
  if (discardKeep2.expectedHandPoints !== discardKeep1.expectedHandPoints) {
    return discardKeep2.expectedHandPoints - discardKeep1.expectedHandPoints;
  }

  const minLength = Math.min(
    discardKeep1.keep.length,
    discardKeep2.keep.length,
  );
  const differingPair: [Card, Card] | undefined = discardKeep1.keep
    .slice(0, minLength)
    // eslint-disable-next-line security/detect-object-injection
    .map((card, index) => [card, discardKeep2.keep[index]] as [Card, Card])
    .find(([card1, card2]) => card1?.rank !== card2?.rank);

  if (differingPair) {
    const [card1, card2] = differingPair;
    return card2?.rank - card1?.rank;
  }

  return 0;
};
