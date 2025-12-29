import { describe, expect, it } from "@jest/globals";
import { CARDS_PER_DISCARD } from "../game/facts";
import { Combination } from "js-combinatorics";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
/* jscpd:ignore-start */
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";
/* jscpd:ignore-end */

describe("scored possible keep discards component", () => {
  const mathRandom = Math.random;

  const dealAndRender = () => {
    const dealtHand = dealHand(mathRandom);

    const { container, queryByRole } = render(
      <ScoredPossibleKeepDiscards
        dealtCards={dealtHand}
        sortOrder={SortOrder.Ascending}
      />,
    );

    return { container, dealtHand, queryByRole };
  };

  const caption = "Post-Starter Points";

  it(`has caption '${caption}'`, () => {
    const { queryByRole } = dealAndRender();

    const table = queryByRole("table");
    expect(table).toBeTruthy();
    expect(table!.getAttribute("aria-label")).toBe(caption);
  });

  it("should render each possible keep and discard pair exactly once", () => {
    const { container } = dealAndRender();

    const nCombs = Number(
      new Combination(dealHand(mathRandom), CARDS_PER_DISCARD).length,
    );

    // The grid structure has rows with role="row" and cells with role="gridcell"
    // eslint-disable-next-line spellcheck/spell-checker
    const rows = container.querySelectorAll("[role='row']");

    expect(rows).toHaveLength(nCombs);

    // eslint-disable-next-line spellcheck/spell-checker
    const cells = container.querySelectorAll("[role='gridcell']");
    const COLUMNS_PER_ROW = 5;

    expect(cells).toHaveLength(nCombs * COLUMNS_PER_ROW);
  });
});
