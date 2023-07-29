import { describe, expect, it } from "@jest/globals";
import { CARDS_PER_DISCARD } from "../game/facts";
import { Calculations } from "./Calculations";
import { Combination } from "js-combinatorics";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByScoreDescending } from "../analysis/analysis";
import { dealHand } from "../game/dealHand";
import { handToSortedString } from "../ui/handToSortedString";
import { render } from "@testing-library/react";

describe("calculations component", () => {
  const mathRandom = Math.random;

  const dealAndRender = () => {
    const dealtHand = dealHand(mathRandom);

    const { container } = render(
      <Calculations
        dealtCards={dealtHand}
        sortOrder={SortOrder.Ascending}
      />,
    );

    return { container, dealtHand };
  };

  const caption = "Pre-cut hand points:";

  it(`has caption '${caption}'`, () => {
    const { container } = dealAndRender();

    expect(container.textContent).toContain(caption);
  });

  it("should render each possible keep and discard pair exactly once", () => {
    const { container } = dealAndRender();

    const nCombs = Number(
      new Combination(dealHand(mathRandom), CARDS_PER_DISCARD).length,
    );
    const handPartsPerDeal = 2;
    expect(container.querySelectorAll(".keep-discard")).toHaveLength(
      nCombs * handPartsPerDeal,
    );
  });

  it("should contain each possible scored keep and discard", () => {
    const { dealtHand, container } = dealAndRender();

    allScoredKeepDiscardsByScoreDescending(dealtHand).forEach(
      (scoredKeepDiscard) => {
        expect(container.textContent).toContain(
          `${handToSortedString(
            scoredKeepDiscard.keep,
            SortOrder.Ascending,
          )}-${handToSortedString(
            scoredKeepDiscard.discard,
            SortOrder.Ascending,
          )} for ${scoredKeepDiscard.points} points`,
        );
      },
    );
  });
});
