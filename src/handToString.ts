import { HandCard } from "./HandCard";
import { SortOrder } from "./SortOrder";
import { sortCards } from "./sortCards";

export function handToString<T extends HandCard>(
  dealtCards: readonly T[],
  sortOrder: SortOrder
): string {
  return sortCards(dealtCards, sortOrder)
    .map((dealtCard) => dealtCard.rankLabel)
    .join("");
}
