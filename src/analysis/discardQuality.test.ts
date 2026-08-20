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
    { best: 8, chosen: 7.996, name: "a loss that rounds away", reported: 0 },
    {
      best: 8,
      chosen: 7.99,
      name: "the smallest visible loss",
      reported: 0.01,
    },
    { best: 8, chosen: 7.5, name: "half a point given up", reported: 0.5 },
    { best: 8, chosen: 4.5, name: "a badly costly choice", reported: 3.5 },
    // Rounding the difference instead of the scores would call these equal, though the table draws 8.01 against 8.00.
    {
      best: 8.006,
      chosen: 8.002,
      name: "scores the table separates by a hundredth",
      reported: 0.01,
    },
    // And it would call these a hundredth apart, though the table draws 8.00 twice.
    {
      best: 8.004,
      chosen: 7.996,
      name: "scores the table draws identically",
      reported: 0,
    },
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
