import type { Card } from "../game/Card";
import type { DealtCard } from "../game/DealtCard";

export type { Meta, StoryObj } from "@storybook/react-vite";
export { SORT_ORDER_NAMES } from "../ui/SortOrderName";
export { SortOrder } from "../ui/SortOrder";

export const createArgTypes = (property: string, labels: string[]) => ({
  [property]: {
    control: {
      labels,
      type: "select",
    },
  },
});

export const toDealtCards = (
  cards: readonly Card[],
  discardedIndices: readonly number[] = [],
): DealtCard[] =>
  cards.map((card, index) => ({
    count: card.count,
    dealOrder: index,
    kept: !discardedIndices.includes(index),
    rank: card.rank,
    rankLabel: card.rankLabel,
  }));
