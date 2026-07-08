/* jscpd:ignore-start */
import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  type StoryObj,
  createArgTypes,
  playDoubleExpanded,
  playToggle,
  toDealtCards,
  waitForLoadingToDisappear,
} from "./stories.common";
import { expect, fireEvent, fn, within } from "storybook/test";
import { CARDS } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
/* jscpd:ignore-end */

/*
 * A loader that fails the next call when armed, then delegates to the real
 * loader. Injected via the `loadCribTable` prop so the load-failure path can be
 * shown without module mocking (which depends on the Vitest runtime and breaks
 * plain Storybook rendering). The story's loader re-arms the flag on each run.
 */
let failNextLoad = false;

const failOnceLoader = (): ReturnType<typeof cribLoader.loadTable> => {
  if (failNextLoad) {
    failNextLoad = false;
    return Promise.reject(new Error("Fake load error"));
  }
  return cribLoader.loadTable();
};

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
    onScoreSortKeyChange: fn(),
    scoreSortKey: ScoredKeepDiscardSortKey.ExpectedNetPoints,
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
export const JackSixFiveFourKingQueenSortedAscending: Story = {
  ...createStory(dealtCards, SortOrder.Ascending),
  args: {
    ...createStory(dealtCards, SortOrder.Ascending).args,
    cribRole: CribRole.Pone,
  },
};
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
  play: playDoubleExpanded,
};

export const DoubleExpandedPone: Story = {
  ...DoubleExpanded,
  args: {
    ...DoubleExpanded.args,
    cribRole: CribRole.Pone,
  },
};

export const SortedByHandPoints: Story = {
  ...JackSixFiveFourKingQueenSortedDescending,
  args: {
    ...JackSixFiveFourKingQueenSortedDescending.args,
    scoreSortKey: ScoredKeepDiscardSortKey.ExpectedHandPoints,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForLoadingToDisappear(canvas);
    const handHeader = await canvas.findByRole("columnheader", {
      name: /Hand/u,
    });

    await expect(handHeader).toHaveAttribute("aria-sort", "descending");
  },
};

export const LoadError: Story = {
  ...JackSixFiveFourKingQueenSortedDescending,
  args: {
    ...JackSixFiveFourKingQueenSortedDescending.args,
    loadCribTable: failOnceLoader,
  },
  loaders: [
    () => {
      failNextLoad = true;
      cribLoader.setTableSync(null);
      playLoader.setTableSync(null);
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const retryButton = await canvas.findByRole("button", { name: /Retry/u });

    await expect(retryButton).toBeVisible();

    await fireEvent.click(retryButton);

    await waitForLoadingToDisappear(canvas);
  },
};
