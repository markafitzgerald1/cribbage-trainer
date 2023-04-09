import { DealtCard } from "../DealtCard";

export interface DealtCardsHook {
  dealtCards: readonly DealtCard[];
  setDealtCards: (dealtCards: readonly DealtCard[]) => void;
}
