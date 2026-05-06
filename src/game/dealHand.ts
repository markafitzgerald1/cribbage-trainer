import { DECK } from "../game/Card";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import type { DealtCard } from "./DealtCard";

export const dealHand = (generateRandomNumber: () => number): DealtCard[] => {
  const deck = [...DECK];
  const dealtCards: DealtCard[] = [];

  for (let i = 0; i < CARDS_PER_DEALT_HAND; i++) {
    const randomIndex = Math.floor(generateRandomNumber() * deck.length);
    // eslint-disable-next-line security/detect-object-injection
    const card = deck[randomIndex]!;
    dealtCards.push({
      ...card,
      dealOrder: i,
      kept: true,
    });
    deck.splice(randomIndex, 1);
  }

  return dealtCards;
};
