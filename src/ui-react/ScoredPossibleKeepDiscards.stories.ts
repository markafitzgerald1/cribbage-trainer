/* jscpd:ignore-start */
import * as loader from "../game/expectedCribPointsTableLoader";
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
import { expect, fireEvent, within } from "storybook/test";
import { CARDS } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
/* jscpd:ignore-end */

/*
 * A loader that fails the next call when armed, then delegates to the real
 * loader. Injected via the `loadTable` prop so the load-failure path can be
 * shown without module mocking (which depends on the Vitest runtime and breaks
 * plain Storybook rendering). The story's loader re-arms the flag on each run.
 */
let failNextLoad = false;

const failOnceLoader = (): ReturnType<typeof loader.loadTable> => {
  if (failNextLoad) {
    failNextLoad = false;
    return Promise.reject(new Error("Fake load error"));
  }
  return loader.loadTable();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForLoadingToDisappear(canvas);
    const headerButton = await canvas.findByRole("button", { name: /E\(h\)/u });
    await fireEvent.click(headerButton);
  },
};

export const LoadError: Story = {
  ...JackSixFiveFourKingQueenSortedDescending,
  args: {
    ...JackSixFiveFourKingQueenSortedDescending.args,
    loadTable: failOnceLoader,
  },
  loaders: [
    () => {
      failNextLoad = true;
      loader.setTableSync(null);
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
