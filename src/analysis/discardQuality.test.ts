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
    {
      best: 8,
      bucket: "0",
      chosen: 8,
      name: "an exactly optimal choice",
      reported: 0,
    },
    {
      best: 8,
      bucket: "0",
      chosen: 7.996,
      name: "a loss that rounds away",
      reported: 0,
    },
    {
      best: 8,
      bucket: "0-0.5",
      chosen: 7.99,
      name: "the smallest visible loss",
      reported: 0.01,
    },
    {
      best: 8,
      bucket: "0-0.5",
      chosen: 7.51,
      name: "a loss just under a half point",
      reported: 0.49,
    },
    {
      best: 8,
      bucket: "0.5-1",
      chosen: 7.5,
      name: "a loss of exactly a half point",
      reported: 0.5,
    },
    {
      best: 8,
      bucket: "0.5-1",
      chosen: 7.01,
      name: "a loss just under a point",
      reported: 0.99,
    },
    {
      best: 8,
      bucket: "1-2",
      chosen: 7,
      name: "a loss of exactly a point",
      reported: 1,
    },
    {
      best: 8,
      bucket: "1-2",
      chosen: 6.01,
      name: "a loss just under two points",
      reported: 1.99,
    },
    {
      best: 8,
      bucket: "2+",
      chosen: 6,
      name: "a loss of exactly two points",
      reported: 2,
    },
    {
      best: 8,
      bucket: "2+",
      chosen: 4.5,
      name: "a loss well past two points",
      reported: 3.5,
    },
    // Rounding the difference instead of the scores would call these equal, though the table draws 8.01 against 8.00.
    {
      best: 8.006,
      bucket: "0-0.5",
      chosen: 8.002,
      name: "scores the table separates by a hundredth",
      reported: 0.01,
    },
    // And it would call these a hundredth apart, though the table draws 8.00 twice.
    {
      best: 8.004,
      bucket: "0",
      chosen: 7.996,
      name: "scores the table draws identically",
      reported: 0,
    },
  ])("buckets $name as $bucket", ({ best, bucket, chosen, reported }) => {
    expect(qualityOf(best, chosen)).toStrictEqual({
      expectedPointsLoss: reported,
      expectedPointsLossBucket: bucket,
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
      expectedPointsLossBucket: "1-2",
      isOptimal: false,
    });
  });
});
