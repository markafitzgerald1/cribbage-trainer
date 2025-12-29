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

    const { container } = render(
      <ScoredPossibleKeepDiscards
        dealtCards={dealtHand}
        sortOrder={SortOrder.Ascending}
      />,
    );

    return { container, dealtHand };
  };

  const caption = "Post-Starter Points";

  it(`has caption '${caption}'`, () => {
    const { container } = dealAndRender();

    expect(container.textContent).toContain(caption);
  });

  it("should render each possible keep and discard pair exactly once", () => {
    const { container } = dealAndRender();

    const nCombs = Number(
      new Combination(dealHand(mathRandom), CARDS_PER_DISCARD).length,
    );

    // We expect nCombs rows. Since each row has 5 cells, we can count cells and divide by 5,
    // but that's brittle if we change columns.
    // Instead, we can look for role="cell" and divide by 5, or check specific content.
    // Since we are not using 'row' role explicitly on a wrapper element for the row (it's flattened grid),
    // counting cells is a reasonable proxy given the implementation details.

    // Actually, ScoredPossibleKeepDiscards renders ScoredPossibleKeepDiscard components.
    // In JSDOM, we see the rendered HTML.
    // The columns are: Keep, Discard, Pre-cut, From cut, Total.
    const cells = container.querySelectorAll("[role='cell']");
    expect(cells).toHaveLength(nCombs * 5);

    // Alternatively, we can check for a specific class that appears once per row if we had one.
    // But we don't.
  });
});
