import { Card } from "./Card";

export interface DealtCard extends Card {
  kept: boolean;
  dealOrder: number;
}
