import "@testing-library/jest-dom";
import { describe, expect, it } from "@jest/globals";
import { CutResultRow } from "./CutResultRow";
import { Rank } from "../game/Card";
import { SortOrder } from "../ui/SortOrder";
import { render } from "@testing-library/react";

const FOUR_POINTS = 4;
const SIX_POINTS = 6;

const CUTS_COLUMN_SELECTOR = '[class*="cutsColumn"]';
const CARD_LABEL_SELECTOR = '[class*="cardLabel"]';

function getCutLabelTexts(renderResult: ReturnType<typeof render>): string[] {
  const cutsColumn = renderResult.container.querySelector(CUTS_COLUMN_SELECTOR);
  if (!cutsColumn) {
    throw new Error("cutsColumn not found");
  }
  const labels = cutsColumn.querySelectorAll(CARD_LABEL_SELECTOR);
  return Array.from(labels).map((label) => label.textContent ?? "");
}

describe("cutResultRow", () => {
  it.each([
    {
      cuts: [Rank.KING, Rank.QUEEN, Rank.JACK, Rank.TEN],
      expected: ["10♦", "J♥", "Q♠", "K♣"],
      name: "ascending order when sortOrder is Ascending",
      sortOrder: SortOrder.Ascending,
    },
    {
      cuts: [Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING],
      expected: ["K♣", "Q♠", "J♥", "10♦"],
      name: "descending order when sortOrder is Descending",
      sortOrder: SortOrder.Descending,
    },
    {
      cuts: [Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE],
      expected: ["5♣", "4♠", "3♥", "2♦", "A♣"],
      name: "descending order when sortOrder is DealOrder",
      sortOrder: SortOrder.DealOrder,
    },
  ])("renders cuts in $name", ({ cuts, expected, sortOrder }) => {
    const renderResult = render(
      <CutResultRow
        cuts={cuts}
        fifteensPoints={FOUR_POINTS}
        flushesPoints={0}
        nobsPoints={0}
        pairsPoints={0}
        runsPoints={0}
        sortOrder={sortOrder}
        totalPoints={SIX_POINTS}
      />,
    );

    expect(getCutLabelTexts(renderResult)).toStrictEqual(expected);
  });
});
