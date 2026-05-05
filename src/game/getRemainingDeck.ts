import { type Card, DECK } from "./Card";

export const getRemainingDeck = (
  knownCards: readonly Card[],
): readonly Card[] =>
  DECK.filter(
    (card) =>
      !knownCards.some((knownCard) => knownCard.rank === card.rank && knownCard.suit === card.suit),
  );
