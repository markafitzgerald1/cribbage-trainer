import { CARD_LABELS, type Card, DECK } from "./Card";

const NOT_FOUND_INDEX = -1;

export const parseCards = (keepSpecifier: string): Card[] => {
  if (keepSpecifier.length === 0) {
    return [];
  }

  const usedCards: Card[] = [];
  return keepSpecifier.split(",").map((rank) => {
    const cardIndex = CARD_LABELS.indexOf(rank);
    if (cardIndex === NOT_FOUND_INDEX) {
      throw new Error(
        `Invalid card rank encountered in test specifier: '${rank}'`,
      );
    }
    const cardToUse = DECK.find(
      (deckCard) =>
        deckCard.rank === cardIndex &&
        !usedCards.some(
          (used) => used.rank === deckCard.rank && used.suit === deckCard.suit,
        ),
    );
    if (!cardToUse) {
      throw new Error(`Too many cards of rank '${rank}' requested`);
    }
    usedCards.push(cardToUse);
    return cardToUse;
  });
};
