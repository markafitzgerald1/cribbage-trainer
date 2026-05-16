/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import { Rank, Suit } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { CutResultRow } from "./CutResultRow";
import { type GroupedCut } from "./groupCutsByResults";
import { SortOrder } from "../ui/SortOrder";
import { render } from "@testing-library/react";
/* jscpd:ignore-end */

const SIX_POINTS = 6;

const CUTS_COLUMN_SELECTOR = '[class*="cutsColumn"]';
const CARD_LABEL_SELECTOR = '[class*="cardLabel"]';
const MUTED_SELECTOR = '[class*="muted"]';

interface RenderCutResultRowOptions {
  readonly cuts?: readonly GroupedCut[];
  readonly pairsPoints?: number;
  readonly sortOrder?: SortOrder;
  readonly totalPoints?: number;
}

function renderCutResultRow({
  cuts = [{ isAllRemaining: true, rank: Rank.FIVE, suits: [] }],
  pairsPoints = 0,
  sortOrder = SortOrder.Ascending,
  totalPoints = SIX_POINTS,
}: RenderCutResultRowOptions = {}) {
  return render(
    <CutResultRow
      cuts={cuts}
      fifteensPoints={0}
      flushesPoints={0}
      nobsPoints={0}
      pairsPoints={pairsPoints}
      runsPoints={0}
      sortOrder={sortOrder}
      totalPoints={totalPoints}
    />,
  );
}

function getCutLabelTexts(renderResult: ReturnType<typeof render>): string[] {
  const cutsColumn = renderResult.container.querySelector(CUTS_COLUMN_SELECTOR);
  if (!cutsColumn) {
    throw new Error("cutsColumn not found");
  }
  const labels = cutsColumn.querySelectorAll(CARD_LABEL_SELECTOR);
  return Array.from(labels).map((label) => label.textContent ?? "");
}

function getMutedTexts(renderResult: ReturnType<typeof render>): string[] {
  return Array.from(
    renderResult.container.querySelectorAll(MUTED_SELECTOR),
    (dash) => dash.textContent ?? "",
  );
}

describe("cutResultRow", () => {
  it.each([
    {
      cuts: [
        { isAllRemaining: true, rank: Rank.KING, suits: [] },
        { isAllRemaining: true, rank: Rank.QUEEN, suits: [] },
        { isAllRemaining: true, rank: Rank.JACK, suits: [] },
        { isAllRemaining: true, rank: Rank.TEN, suits: [] },
      ],
      expected: ["10 J Q K"],
      name: "ascending order when sortOrder is Ascending",
      sortOrder: SortOrder.Ascending,
    },
    {
      cuts: [
        { isAllRemaining: true, rank: Rank.TEN, suits: [] },
        { isAllRemaining: true, rank: Rank.JACK, suits: [] },
        { isAllRemaining: true, rank: Rank.QUEEN, suits: [] },
        { isAllRemaining: true, rank: Rank.KING, suits: [] },
      ],
      expected: ["K Q J 10"],
      name: "descending order when sortOrder is Descending",
      sortOrder: SortOrder.Descending,
    },
    {
      cuts: [
        { isAllRemaining: true, rank: Rank.ACE, suits: [] },
        { isAllRemaining: true, rank: Rank.TWO, suits: [] },
        { isAllRemaining: true, rank: Rank.THREE, suits: [] },
        { isAllRemaining: true, rank: Rank.FOUR, suits: [] },
        { isAllRemaining: true, rank: Rank.FIVE, suits: [] },
      ],
      expected: ["5 4 3 2 A"],
      name: "descending order when sortOrder is DealOrder",
      sortOrder: SortOrder.DealOrder,
    },
    {
      cuts: [
        { isAllRemaining: true, rank: Rank.ACE, suits: [] },
        {
          isAllRemaining: false,
          rank: Rank.ACE,
          suits: [Suit.SPADES],
        },
      ],
      expected: ["A", "A♠"],
      name: "mixed rank and card with same rank",
      sortOrder: SortOrder.Ascending,
    },
    {
      cuts: [
        {
          isAllRemaining: false,
          rank: Rank.ACE,
          suits: [Suit.SPADES],
        },
        {
          isAllRemaining: false,
          rank: Rank.ACE,
          suits: [Suit.HEARTS],
        },
      ],
      expected: ["A♠", "A♥"],
      name: "cards with same rank but different suits (not grouped)",
      sortOrder: SortOrder.Ascending,
    },
    {
      cuts: [
        {
          isAllRemaining: false,
          rank: Rank.KING,
          suits: [Suit.CLUBS, Suit.DIAMONDS],
        },
        {
          isAllRemaining: false,
          rank: Rank.TEN,
          suits: [Suit.CLUBS, Suit.DIAMONDS],
        },
      ],
      expected: ["10 K (♣♦)"],
      name: "ranks sharing the same suits are grouped",
      sortOrder: SortOrder.Ascending,
    },
  ])("renders cuts in $name", ({ cuts, expected, sortOrder }) => {
    const renderResult = renderCutResultRow({ cuts, sortOrder });

    expect(getCutLabelTexts(renderResult)).toStrictEqual(expected);
  });

  it("renders zero point categories as dimmed dashes", () => {
    const renderResult = renderCutResultRow({ pairsPoints: SIX_POINTS });

    expect(getMutedTexts(renderResult)).toStrictEqual(["—", "—", "—", "—"]);
  });

  it("renders zero total points as a dimmed dash", () => {
    const renderResult = renderCutResultRow({
      pairsPoints: SIX_POINTS,
      totalPoints: 0,
    });

    expect(getMutedTexts(renderResult)).toStrictEqual([
      "—",
      "—",
      "—",
      "—",
      "—",
    ]);
  });
});
