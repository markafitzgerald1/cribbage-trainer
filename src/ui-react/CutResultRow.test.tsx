/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import { type Card, Rank, parseCard } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { CutResultRow } from "./CutResultRow";
import { SortOrder } from "../ui/SortOrder";
import { render } from "@testing-library/react";
/* jscpd:ignore-end */

const SIX_POINTS = 6;

const CUTS_COLUMN_SELECTOR = '[class*="cutsColumn"]';
const CARD_LABEL_SELECTOR = '[class*="cardLabel"]';
const MUTED_SELECTOR = '[class*="muted"]';

interface RenderCutResultRowOptions {
  readonly cuts?: readonly (Rank | Card)[];
  readonly pairsPoints?: number;
  readonly sortOrder?: SortOrder;
}

function renderCutResultRow({
  cuts = [Rank.FIVE],
  pairsPoints = 0,
  sortOrder = SortOrder.Ascending,
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
      totalPoints={SIX_POINTS}
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

describe("cutResultRow", () => {
  it.each([
    {
      cuts: [Rank.KING, Rank.QUEEN, Rank.JACK, Rank.TEN],
      expected: ["10", "J", "Q", "K"],
      name: "ascending order when sortOrder is Ascending",
      sortOrder: SortOrder.Ascending,
    },
    {
      cuts: [Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING],
      expected: ["K", "Q", "J", "10"],
      name: "descending order when sortOrder is Descending",
      sortOrder: SortOrder.Descending,
    },
    {
      cuts: [Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE],
      expected: ["5", "4", "3", "2", "A"],
      name: "descending order when sortOrder is DealOrder",
      sortOrder: SortOrder.DealOrder,
    },
    {
      cuts: [Rank.ACE, parseCard("AS")],
      expected: ["A", "A♠"],
      name: "mixed rank and card with same rank",
      sortOrder: SortOrder.Ascending,
    },
    {
      cuts: [parseCard("AS"), parseCard("AH")],
      expected: ["A♠", "A♥"],
      name: "cards with same rank sorted by suit",
      sortOrder: SortOrder.Ascending,
    },
  ])("renders cuts in $name", ({ cuts, expected, sortOrder }) => {
    const renderResult = renderCutResultRow({ cuts, sortOrder });

    expect(getCutLabelTexts(renderResult)).toStrictEqual(expected);
  });

  it("renders zero point categories as dimmed dashes", () => {
    const renderResult = renderCutResultRow({ pairsPoints: SIX_POINTS });

    const mutedDashes = renderResult.container.querySelectorAll(MUTED_SELECTOR);

    expect(mutedDashes).toHaveLength(4);
    expect(
      Array.from(mutedDashes).map((dash) => dash.textContent),
    ).toStrictEqual(["—", "—", "—", "—"]);
  });
});
