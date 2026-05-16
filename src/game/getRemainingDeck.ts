import { type Card, DECK } from "./Card";

export const getRemainingDeck = (
  knownCards: readonly Card[],
): readonly Card[] =>
  DECK.filter(
    (deckCard) =>
      !knownCards.some(
        (known) => known.rank === deckCard.rank && known.suit === deckCard.suit,
      ),
  );
