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

const qualityOfLoss = (loss: number) =>
  getDiscardQuality([
    scoredOption(BEST_EXPECTED_NET_POINTS, false),
    scoredOption(BEST_EXPECTED_NET_POINTS - loss, true),
  ]);

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
    { bucket: "0", loss: 0, name: "an exactly optimal choice", reported: 0 },
    { bucket: "0", loss: 0.004, name: "a loss that rounds away", reported: 0 },
    {
      bucket: "0-0.5",
      loss: 0.01,
      name: "the smallest visible loss",
      reported: 0.01,
    },
    {
      bucket: "0-0.5",
      loss: 0.49,
      name: "a loss just under a half point",
      reported: 0.49,
    },
    {
      bucket: "0.5-1",
      loss: 0.5,
      name: "a loss of exactly a half point",
      reported: 0.5,
    },
    {
      bucket: "0.5-1",
      loss: 0.99,
      name: "a loss just under a point",
      reported: 0.99,
    },
    { bucket: "1-2", loss: 1, name: "a loss of exactly a point", reported: 1 },
    {
      bucket: "1-2",
      loss: 1.99,
      name: "a loss just under two points",
      reported: 1.99,
    },
    {
      bucket: "2+",
      loss: 2,
      name: "a loss of exactly two points",
      reported: 2,
    },
    {
      bucket: "2+",
      loss: 3.5,
      name: "a loss well past two points",
      reported: 3.5,
    },
  ])("buckets $name as $bucket", ({ bucket, loss, reported }) => {
    expect(qualityOfLoss(loss)).toStrictEqual({
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
