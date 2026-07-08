import type { DealtCard } from "./DealtCard";
import { discardIsComplete } from "./discardIsComplete";

// Stable states are kept in browser history; transient ones are replaced.
// Stable means no discards are selected yet or the discard is complete.
export const isStableDiscardState = (deal: readonly DealtCard[]): boolean =>
  deal.every((dealtCard) => dealtCard.kept) || discardIsComplete(deal);
