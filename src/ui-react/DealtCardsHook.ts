import { DealtCard } from "../game/DealtCard";

export interface DealtCardsHook {
  dealtCards: readonly DealtCard[];
  setDealtCards: (dealtCards: readonly DealtCard[]) => void;
}
