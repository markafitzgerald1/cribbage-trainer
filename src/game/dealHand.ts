import { CARDS, INDICES_PER_SUIT } from "../game/Card";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import { DealtCard } from "./DealtCard";

export const dealHand = (generateRandomNumber: () => number): DealtCard[] =>
  Array.from({ length: CARDS_PER_DEALT_HAND }, () =>
    Math.floor(generateRandomNumber() * INDICES_PER_SUIT),
  ).map((rankValue, dealOrder) => ({
    // eslint-disable-next-line security/detect-object-injection
    ...CARDS[rankValue]!,
    dealOrder,
    kept: true,
  }));
