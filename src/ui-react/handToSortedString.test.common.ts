import { DealtCard } from "../game/DealtCard";
import { SortOrder } from "../ui/SortOrder";
import { sortCards } from "../ui/sortCards";

export const handToSortedString = (
  handCards: readonly DealtCard[],
  sortOrder: SortOrder,
): string =>
  sortCards(handCards, sortOrder)
    .map((dealtCard) => dealtCard.rankLabel)
    .join("");
