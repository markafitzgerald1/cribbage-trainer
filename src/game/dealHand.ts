import { CARDS, INDICES_PER_SUIT } from "../game/Card";
import { CARDS_PER_DEALT_HAND } from "../game/facts";

export const dealHand = (generateRandomNumber: () => number) =>
  Array.from({ length: CARDS_PER_DEALT_HAND }, () =>
    Math.floor(generateRandomNumber() * INDICES_PER_SUIT)
  ).map((rankValue, dealOrder) => ({
    ...CARDS[rankValue]!,
    dealOrder,
    kept: true,
  }));
