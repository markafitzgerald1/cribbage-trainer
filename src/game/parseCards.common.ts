import { CARD_LABELS, Card, CARDS as card } from "./Card";

const NOT_FOUND_INDEX = -1;

export const parseCards = (keepSpecifier: string): Card[] => {
  if (keepSpecifier.length === 0) {
    return [];
  }

  return keepSpecifier.split(",").map((rank) => {
    const cardIndex = CARD_LABELS.indexOf(rank);
    if (cardIndex === NOT_FOUND_INDEX) {
      throw new Error(
        `Invalid card rank encountered in test specifier: '${rank}'`,
      );
    }
    // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
    return card[cardIndex]!;
  });
};
