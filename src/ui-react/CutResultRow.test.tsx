import "@testing-library/jest-dom";
import { describe, expect, it } from "@jest/globals";
import { CutResultRow } from "./CutResultRow";
import { Rank } from "../game/Card";
import { SortOrder } from "../ui/SortOrder";
import { render } from "@testing-library/react";

const CUT_COUNT = 8;
const TWO_POINTS = 2;
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

/* jscpd:ignore-start */
describe("cutResultRow", () => {
  it("renders cuts in ascending order when sortOrder is Ascending", () => {
    const renderResult = render(
      <CutResultRow
        cutCount={CUT_COUNT}
        cuts={[Rank.KING, Rank.QUEEN, Rank.JACK, Rank.TEN]}
        fifteensPoints={TWO_POINTS}
        pairsPoints={FOUR_POINTS}
        runsPoints={0}
        sortOrder={SortOrder.Ascending}
        totalPoints={SIX_POINTS}
      />,
    );

    expect(getCutLabelTexts(renderResult)).toStrictEqual(["10", "J", "Q", "K"]);
  });

  it("renders cuts in descending order when sortOrder is Descending", () => {
    const renderResult = render(
      <CutResultRow
        cutCount={CUT_COUNT}
        cuts={[Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING]}
        fifteensPoints={TWO_POINTS}
        pairsPoints={FOUR_POINTS}
        runsPoints={0}
        sortOrder={SortOrder.Descending}
        totalPoints={SIX_POINTS}
      />,
    );

    expect(getCutLabelTexts(renderResult)).toStrictEqual(["K", "Q", "J", "10"]);
  });

  it("renders cuts in descending order when sortOrder is DealOrder", () => {
    const renderResult = render(
      <CutResultRow
        cutCount={CUT_COUNT}
        cuts={[Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE]}
        fifteensPoints={FOUR_POINTS}
        pairsPoints={0}
        runsPoints={0}
        sortOrder={SortOrder.DealOrder}
        totalPoints={FOUR_POINTS}
      />,
    );

    expect(getCutLabelTexts(renderResult)).toStrictEqual([
      "5",
      "4",
      "3",
      "2",
      "A",
    ]);
  });
});
/* jscpd:ignore-end */
