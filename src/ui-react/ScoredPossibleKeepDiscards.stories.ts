/* jscpd:ignore-start */
import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import { CARDS, parseHand } from "../game/Card";
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
import { expect, fireEvent, fn, waitFor, within } from "storybook/test";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import type { UncertaintySource } from "../game/uncertaintyLoader";
import { deferredUncertainty } from "../game/uncertaintySidecar.test.common";
import { shippedCribUncertainty } from "../game/cribUncertaintyLoader";
import { shippedPlayUncertainty } from "../game/playUncertaintyLoader";

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
    onAnalysisRendered: fn(),
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

/*
 * Waits out the table load and states what the caption then reads, which is
 * where both role-cost stories start; jscpd counts the second spelling of
 * that preamble as a clone. Asserting it here also keeps each story's own
 * negative or computed-style check downstream of a caption known to be on
 * screen.
 */
const captionAfterLoad = async (
  canvasElement: HTMLElement,
  expectedText: string,
) => {
  const canvas = within(canvasElement);
  await waitForLoadingToDisappear(canvas);

  await expect(canvas.getByRole("status")).toHaveTextContent(expectedText);

  return canvas;
};

/*
 * Discarding the 9 of diamonds and the 3 of spades here costs 3.11 as
 * dealer and exactly nothing as pone, so the caption shows the #824 pair of
 * role costs beside the component decomposition it does not replace.
 */
export const RoleLossPair: Story = {
  ...createStory(
    toDealtCards(parseHand("9D,9C,9H,4C,4H,3S"), [0, 5]),
    SortOrder.Descending,
  ),
  play: async ({ canvasElement }) => {
    const canvas = await captionAfterLoad(
      canvasElement,
      "Sub-optimal: 3.11 as dealer, 0.00 as pone",
    );

    /*
     * Assert what the reader sees rather than the class that produced it.
     * The underline is now the whole mark, so its thickness is pinned too:
     * the browser default is thinner and would satisfy a bare "underline"
     * while reading as a quirk of the font. The color is pinned to the
     * badge's own, because a brighter one here outshouted the figure that
     * matters — the cost under the role actually held.
     */
    const figure = canvas.getByText("0.00 as pone");
    const rendered = window.getComputedStyle(figure);
    const badge = figure.parentElement as HTMLElement;

    await expect(rendered.textDecorationLine).toBe("underline");
    await expect(rendered.textDecorationThickness).toBe("2px");
    await expect(rendered.color).toBe(window.getComputedStyle(badge).color);
  },
};

const roleLossWithheldStory = createStory(
  toDealtCards(parseHand("KH,QS,10D,9C,6S,5H"), [0, 4]),
  SortOrder.Descending,
);

/*
 * The state most hands are in: this discard costs 0.82 as pone and 3.46 as
 * dealer, so the reversed figure would say only that the role not held
 * would have been worse. One figure, in the wording this caption carried
 * before #824.
 */
export const RoleLossWithheld: Story = {
  ...roleLossWithheldStory,
  args: { ...roleLossWithheldStory.args, cribRole: CribRole.Pone },
  play: async ({ canvasElement }) => {
    const canvas = await captionAfterLoad(
      canvasElement,
      "Sub-optimal: 0.82 pts lost",
    );

    // The caption is on screen with its single figure, so the reversed-role clause is absent rather than simply not rendered.
    await expect(canvas.queryByText(/as dealer/u)).toBeNull();
  },
};

/*
 * Held rather than built per render: the component takes each source as an
 * effect dependency, so a fresh object each time would restart the load. It
 * also stands in for the sidecar a story is not exercising, which is what
 * lets each one count the figures on screen.
 */
const NO_UNCERTAINTY = deferredUncertainty(null);

/*
 * Both sidecars load after the ranked results, so these three cover both
 * halves of the contract that keeps a recommendation complete without them:
 * each figure on screen when its document arrives, and the same analysis
 * unchanged when neither does.
 */
const expandedCanvas = async (context: {
  readonly canvasElement: HTMLElement;
}) => {
  await playToggle(context);

  return within(context.canvasElement);
};

const FIGURE_PATTERN = /^\u00b1\d+\.\d\d$/u;
const ROW_FIGURE_PATTERN = /\u00b1\d+\.\d\d/u;

const expandedWithFigures = async (
  context: { readonly canvasElement: HTMLElement },
  expectedFigures: number,
) => {
  const canvas = await expandedCanvas(context);

  await waitFor(
    async () => {
      await expect(canvas.queryAllByText(FIGURE_PATTERN)).toHaveLength(
        expectedFigures,
      );
    },
    { timeout: 10000 },
  );

  return canvas;
};

/*
 * A story per sidecar, silencing the other one so the count on screen is
 * unambiguous about which document produced the figure. Built by a factory
 * rather than written out twice: the two differ only in which source is
 * silenced and which row is then expected to carry the figure.
 */
const figureStory = (
  cribUncertaintySource: UncertaintySource,
  playUncertaintySource: UncertaintySource,
  rowName: RegExp,
): Story => ({
  ...Expanded,
  args: {
    ...Expanded.args,
    cribUncertaintySource,
    playUncertaintySource,
  },
  play: async (context) => {
    const canvas = await expandedWithFigures(context, 1);

    await expect(
      canvas.getByRole("button", { name: rowName }),
    ).toHaveTextContent(ROW_FIGURE_PATTERN);
  },
});

export const CribUncertainty: Story = figureStory(
  shippedCribUncertainty,
  NO_UNCERTAINTY,
  /Crib avg/u,
);

export const PlayUncertainty: Story = figureStory(
  NO_UNCERTAINTY,
  shippedPlayUncertainty,
  /You - Opp/u,
);

export const UncertaintyUnavailable: Story = {
  ...Expanded,
  args: {
    ...Expanded.args,
    cribUncertaintySource: NO_UNCERTAINTY,
    playUncertaintySource: NO_UNCERTAINTY,
  },
  play: async (context) => {
    const canvas = await expandedWithFigures(context, 0);

    await expect(await canvas.findByText(/Crib avg/u)).toBeVisible();
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
