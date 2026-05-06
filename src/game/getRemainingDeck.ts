import { type Card, DECK, INDICES_PER_SUIT, SUITS_PER_DECK } from "./Card";
import { rankCounts } from "./rankCounts";

export const getRemainingDeck = (
  knownCards: readonly Card[],
): readonly Card[] => {
  const countsByRank = rankCounts(knownCards);
  const deck: Card[] = [];
  for (let rank = 0; rank < INDICES_PER_SUIT; rank += 1) {
    // eslint-disable-next-line security/detect-object-injection
    const remaining = SUITS_PER_DECK - (countsByRank[rank] || 0);
    if (remaining > 0) {
      const cardsOfRank = DECK.filter((card) => card.rank === rank);
      deck.push(...cardsOfRank.slice(0, remaining));
    }
  }
  return deck;
};
