import { CARDS_PER_KEPT_HAND } from "../game/facts";
import type { DealtCard } from "./DealtCard";

export const discardIsComplete = (deal: readonly DealtCard[]) =>
  deal.filter((dealtCard) => dealtCard.kept).length === CARDS_PER_KEPT_HAND;
