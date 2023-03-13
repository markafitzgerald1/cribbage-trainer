import { DealtCard } from "../DealtCard";

export interface DealtCardsHook {
  dealtCards: DealtCard[];
  setDealtCards: (dealtCards: DealtCard[]) => void;
}
