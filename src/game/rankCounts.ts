import { INDICES_PER_SUIT, type RankedCard } from "./Card";

export const rankCounts = (cards: readonly RankedCard[]) =>
  cards.reduce((counts: number[], card: RankedCard): number[] => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    counts[card.rank]! += 1;
    return counts;
  }, Array<number>(INDICES_PER_SUIT).fill(0));
