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

function rankCut(rank: Rank): GroupedCut {
  return { isAllRemaining: true, rank, suits: [] };
}

function suitedCut(rank: Rank, suit: Suit): GroupedCut {
  return { isAllRemaining: false, rank, suits: [suit] };
}

function renderCutResultRow({
  cuts = [rankCut(Rank.FIVE)],
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
        rankCut(Rank.KING),
        rankCut(Rank.QUEEN),
        rankCut(Rank.JACK),
        rankCut(Rank.TEN),
      ],
      expected: ["10 J Q K"],
      name: "ascending order when sortOrder is Ascending",
      sortOrder: SortOrder.Ascending,
    },
    {
      cuts: [
        rankCut(Rank.TEN),
        rankCut(Rank.JACK),
        rankCut(Rank.QUEEN),
        rankCut(Rank.KING),
      ],
      expected: ["K Q J 10"],
      name: "descending order when sortOrder is Descending",
      sortOrder: SortOrder.Descending,
    },
    {
      cuts: [
        rankCut(Rank.ACE),
        rankCut(Rank.TWO),
        rankCut(Rank.THREE),
        rankCut(Rank.FOUR),
        rankCut(Rank.FIVE),
      ],
      expected: ["5 4 3 2 A"],
      name: "descending order when sortOrder is DealOrder",
      sortOrder: SortOrder.DealOrder,
    },
    {
      cuts: [rankCut(Rank.ACE), suitedCut(Rank.ACE, Suit.SPADES)],
      expected: ["A"],
      name: "mixed rank and card with same rank (merged)",
      sortOrder: SortOrder.Ascending,
    },
    {
      cuts: [
        suitedCut(Rank.ACE, Suit.SPADES),
        suitedCut(Rank.ACE, Suit.HEARTS),
      ],
      expected: ["A (♠♥)"],
      name: "cards with same rank but different suits (now grouped)",
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
    {
      cuts: [
        rankCut(Rank.KING),
        suitedCut(Rank.QUEEN, Suit.HEARTS),
        rankCut(Rank.JACK),
      ],
      expected: ["K", "Q♥", "J"],
      name: "non-adjacent ranks sharing the same suits remain separated",
      sortOrder: SortOrder.Descending,
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
