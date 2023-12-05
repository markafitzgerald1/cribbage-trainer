import { CARDS, Rank } from "../game/Card";

export const getTenClass = (rankValue: Rank, tenClass: string) =>
  rankValue === CARDS.TEN.rank ? tenClass : "";
