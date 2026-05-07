import { type Card, SUITS } from "../game/Card";

export const compareByExpectedScoreThenRankDescending = (
  discardKeep1: {
    readonly expectedHandPoints: number;
    readonly keep: readonly Card[];
  },
  discardKeep2: {
    readonly expectedHandPoints: number;
    readonly keep: readonly Card[];
  },
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
    .find(
      ([card1, card2]) =>
        card1?.rank !== card2?.rank || card1?.suit !== card2?.suit,
    );

  if (differingPair) {
    const [card1, card2] = differingPair;
    if (card1?.rank !== card2?.rank) {
      return card2?.rank - card1?.rank;
    }
    return SUITS.indexOf(card2?.suit) - SUITS.indexOf(card1?.suit);
  }

  return 0;
};
