import { HandCard } from "./HandCard";

export interface DealtCard extends HandCard {
  kept: boolean;
}
