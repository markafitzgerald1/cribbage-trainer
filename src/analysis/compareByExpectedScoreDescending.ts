import { type Card, SUITS } from "../game/Card";

export const ScoredKeepDiscardSortKey = {
  ExpectedCribPoints: "signedExpectedCribPoints",
  ExpectedHandPoints: "expectedHandPoints",
  ExpectedNetPoints: "expectedNetPoints",
} as const;

export type ScoredKeepDiscardSortKey =
  (typeof ScoredKeepDiscardSortKey)[keyof typeof ScoredKeepDiscardSortKey];

interface ComparableScoredKeepDiscard {
  readonly expectedHandPoints: number;
  readonly expectedNetPoints: number;
  readonly keep: readonly Card[];
  readonly signedExpectedCribPoints: number;
}

const compareByKeepRankDescending = (
  discardKeep1: {
    readonly keep: readonly Card[];
  },
  discardKeep2: {
    readonly keep: readonly Card[];
  },
): number => {
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

const getScore = (
  discardKeep: ComparableScoredKeepDiscard,
  sortKey: ScoredKeepDiscardSortKey,
) => {
  switch (sortKey) {
    case ScoredKeepDiscardSortKey.ExpectedCribPoints:
      return discardKeep.signedExpectedCribPoints;
    case ScoredKeepDiscardSortKey.ExpectedHandPoints:
      return discardKeep.expectedHandPoints;
    case ScoredKeepDiscardSortKey.ExpectedNetPoints:
      return discardKeep.expectedNetPoints;
    default:
      return discardKeep.expectedNetPoints;
  }
};

export const compareByExpectedScoreThenRankDescending =
  (sortKey: ScoredKeepDiscardSortKey) =>
  (
    discardKeep1: ComparableScoredKeepDiscard,
    discardKeep2: ComparableScoredKeepDiscard,
  ): number => {
    const score1 = getScore(discardKeep1, sortKey);
    const score2 = getScore(discardKeep2, sortKey);

    if (score2 !== score1) {
      return score2 - score1;
    }

    return compareByKeepRankDescending(discardKeep1, discardKeep2);
  };

export const compareByExpectedNetScoreThenRankDescending =
  compareByExpectedScoreThenRankDescending(
    ScoredKeepDiscardSortKey.ExpectedNetPoints,
  );
