/* jscpd:ignore-start */
import * as loader from "../game/expectedCribPointsTableLoader";
import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  type StoryObj,
  createArgTypes,
  playToggle,
  toDealtCards,
} from "./stories.common";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import { CARDS } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { vi } from "vitest";
/* jscpd:ignore-end */

interface MockGlobal {
  shouldFailLoad?: boolean;
}

const mockGlobal = globalThis as unknown as MockGlobal;

vi.mock("../game/expectedCribPointsTableLoader", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("../game/expectedCribPointsTableLoader")
    >();
  return {
    ...original,
    loadTable: () => {
      if (mockGlobal.shouldFailLoad) {
        return Promise.reject(new Error("Fake load error"));
      }
      return original.loadTable();
    },
  };
});

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: ScoredPossibleKeepDiscards,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "ScoredPossibleKeepDiscards",
} satisfies Meta<typeof ScoredPossibleKeepDiscards>;

export default meta;
type Story = StoryObj<typeof meta>;

const createStory = (dealtCards: DealtCard[], sortOrder: SortOrder): Story => ({
  args: {
    cribRole: CribRole.Dealer,
    dealtCards,
    sortOrder,
  },
});

const dealtCards = toDealtCards(
  [CARDS.JACK, CARDS.SIX, CARDS.FIVE, CARDS.FOUR, CARDS.KING, CARDS.QUEEN],
  [0, 1],
);

export const JackSixFiveFourKingQueenSortedDescending: Story = createStory(
  dealtCards,
  SortOrder.Descending,
);
export const JackSixFiveFourKingQueenSortedAscending: Story = createStory(
  dealtCards,
  SortOrder.Ascending,
);
export const JackSixFiveFourKingQueenSortedDealOrder: Story = createStory(
  dealtCards,
  SortOrder.DealOrder,
);

export const Expanded: Story = {
  ...JackSixFiveFourKingQueenSortedDescending,
  play: playToggle,
};

export const DoubleExpanded: Story = {
  ...Expanded,
  play: (context) => playToggle(context, { toggleStarterDetails: true }),
};

export const SortedByHandPoints: Story = {
  ...JackSixFiveFourKingQueenSortedDescending,
  /* jscpd:ignore-start */
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      async () => {
        await expect(canvas.queryByText("Loading analysis...")).toBeNull();
      },
      { timeout: 5000 },
    );
    const headerButton = await canvas.findByRole("button", { name: /E\(h\)/u });
    await fireEvent.click(headerButton);
  },
  /* jscpd:ignore-end */
};

export const LoadError: Story = {
  ...JackSixFiveFourKingQueenSortedDescending,
  loaders: [
    () => {
      mockGlobal.shouldFailLoad = true;
      loader.setTableSync(null);
    },
  ],
  /* jscpd:ignore-start */
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const retryButton = await canvas.findByRole("button", { name: /Retry/u });

    await expect(retryButton).toBeVisible();

    mockGlobal.shouldFailLoad = false;

    await fireEvent.click(retryButton);

    await waitFor(
      async () => {
        await expect(canvas.queryByText("Loading analysis...")).toBeNull();
      },
      { timeout: 5000 },
    );
  },
  /* jscpd:ignore-end */
};
