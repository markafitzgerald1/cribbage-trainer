import { type Card, DECK } from "../game/Card";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import type { DealtCard } from "./DealtCard";

export const dealHand = (generateRandomNumber: () => number): DealtCard[] => {
  const deck = [...DECK];
  const dealtCards: DealtCard[] = [];

  for (let index = 0; index < CARDS_PER_DEALT_HAND; index += 1) {
    const randomIndex = Math.floor(generateRandomNumber() * deck.length);
    const [card] = deck.splice(randomIndex, 1) as [Card];

    dealtCards.push({
      ...card,
      dealOrder: index,
      kept: true,
    });
  }

  return dealtCards;
};
