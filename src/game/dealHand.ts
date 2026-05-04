import { CARDS_PER_DEALT_HAND } from "../game/facts";
import { DECK } from "../game/Card";
import type { DealtCard } from "./DealtCard";

export const dealHand = (generateRandomNumber: () => number): DealtCard[] => {
  const deck = [...DECK];
  const hand: DealtCard[] = [];

  for (let dealOrder = 0; dealOrder < CARDS_PER_DEALT_HAND; dealOrder += 1) {
    const randomIndex = Math.floor(generateRandomNumber() * deck.length);
    // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
    const card = deck[randomIndex]!;
    // Remove the card from the deck
    deck.splice(randomIndex, 1);

    hand.push({
      ...card,
      dealOrder,
      kept: true,
    });
  }

  return hand;
};
