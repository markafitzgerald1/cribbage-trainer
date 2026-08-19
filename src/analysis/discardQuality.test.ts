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
    { bucket: "0", loss: 0, name: "an exactly optimal choice" },
    { bucket: "0", loss: 0.004, name: "a loss that rounds away" },
    { bucket: "0-0.5", loss: 0.01, name: "the smallest visible loss" },
    { bucket: "0-0.5", loss: 0.49, name: "a loss just under a half point" },
    { bucket: "0.5-1", loss: 0.5, name: "a loss of exactly a half point" },
    { bucket: "0.5-1", loss: 0.99, name: "a loss just under a point" },
    { bucket: "1-2", loss: 1, name: "a loss of exactly a point" },
    { bucket: "1-2", loss: 1.99, name: "a loss just under two points" },
    { bucket: "2+", loss: 2, name: "a loss of exactly two points" },
    { bucket: "2+", loss: 3.5, name: "a loss well past two points" },
  ])("buckets $name as $bucket", ({ bucket, loss }) => {
    const roundedLoss = Number(loss.toFixed(2));
    expect(qualityOfLoss(loss)).toStrictEqual({
      expectedPointsLoss: bucket === "0" ? 0 : roundedLoss,
      expectedPointsLossBucket: bucket,
      isOptimal: bucket === "0",
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
