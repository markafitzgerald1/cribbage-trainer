import {
  type ScoredKeepDiscardChoice,
  getDiscardQuality,
} from "./discardQuality";
import { describe, expect, it } from "@jest/globals";

const BEST_EXPECTED_NET_POINTS = 8;

const scoredOption = (
  expectedNetPoints: number,
  isChosen: boolean,
): ScoredKeepDiscardChoice => ({
  discard: [{ kept: !isChosen }, { kept: !isChosen }],
  expectedNetPoints,
});

const qualityOf = (best: number, chosen: number) =>
  getDiscardQuality([scoredOption(best, false), scoredOption(chosen, true)]);

describe("getDiscardQuality", () => {
  it("reports nothing while no option's cards are both discarded", () => {
    expect(
      getDiscardQuality([
        scoredOption(BEST_EXPECTED_NET_POINTS, false),
        { discard: [{ kept: false }, { kept: true }], expectedNetPoints: 6 },
      ]),
    ).toBeNull();
  });

  it.each([
    { best: 8, chosen: 8, name: "an exactly optimal choice", reported: 0 },
    // Two options the model scores equally: picking either is optimal play, and only floating point separates them.
    {
      best: 0.1 + 0.2,
      chosen: 0.3,
      name: "a tie only floating point separates",
      reported: 0,
    },
    // Displayed identically at two decimals, but the model does separate them, so this is not the top choice.
    {
      best: 8,
      chosen: 7.996,
      name: "a loss too small for the table to show",
      reported: 0.004,
    },
    {
      best: 8,
      chosen: 7.99,
      name: "the smallest visible loss",
      reported: 0.01,
    },
    { best: 8, chosen: 7.5, name: "half a point given up", reported: 0.5 },
    { best: 8, chosen: 4.5, name: "a badly costly choice", reported: 3.5 },
  ])("reports $name as $reported", ({ best, chosen, reported }) => {
    expect(qualityOf(best, chosen)).toStrictEqual({
      expectedPointsLoss: reported,
      isOptimal: reported === 0,
    });
  });

  it("measures the loss against the best option wherever it sits in the list", () => {
    expect(
      getDiscardQuality([
        scoredOption(BEST_EXPECTED_NET_POINTS - 1.25, true),
        scoredOption(BEST_EXPECTED_NET_POINTS, false),
      ]),
    ).toStrictEqual({
      expectedPointsLoss: 1.25,
      isOptimal: false,
    });
  });
});
