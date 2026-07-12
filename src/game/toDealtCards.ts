import { type Card, isSamePhysicalCard } from "./Card";
import type { DealtCard } from "./DealtCard";

export const toDealtCards = (
  cards: readonly Card[],
  discards: readonly Card[] | null,
): DealtCard[] =>
  cards.map((card, dealOrder) => ({
    ...card,
    dealOrder,
    kept: !(discards ?? []).some((discard) =>
      isSamePhysicalCard(card, discard),
    ),
  }));
