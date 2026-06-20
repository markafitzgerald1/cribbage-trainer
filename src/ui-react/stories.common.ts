import { expect, fireEvent, within } from "storybook/test";
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
    suit: card.suit,
  }));

export const playToggle = async (
  { canvasElement }: { readonly canvasElement: HTMLElement },
  { toggleCribDetails = false, toggleStarterDetails = false } = {},
) => {
  const canvas = within(canvasElement);
  const table = await canvas.findByRole("table");
  const rows = await within(table).findAllByRole("row");
  const row = rows.length === 1 ? rows[0] : rows[1];
  if (row) {
    await fireEvent.click(row);
  }

  await expect(await canvas.findByText(/Hand starter/u)).toBeVisible();

  if (toggleStarterDetails) {
    const starterAvgLabel = await canvas.findByText(/Hand starter/u);
    await fireEvent.click(starterAvgLabel);

    await expect(await canvas.findByText("Points")).toBeVisible();
  }

  if (toggleCribDetails) {
    const cribAvgLabel = await canvas.findByText(/Crib avg/u);
    await fireEvent.click(cribAvgLabel);

    await expect(await canvas.findByText("Points")).toBeVisible();
  }
};
