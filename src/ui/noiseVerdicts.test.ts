import {
  MISTAKE_RECORD,
  NOISE_STANDARD_ERROR,
  OPTIMAL_RECORD,
  WITHIN_NOISE_RECORD,
  noiseTally,
} from "./noiseVerdicts.test.common";
import {
  type NoiseCandidate,
  countWithinNoise,
  isNoiseCandidate,
  isRecordedDiscardWithinNoise,
  noiseVerdictKey,
} from "./noiseVerdicts";
import { SUCCESSES_FOR_MASTERY, buildMistakeQueue } from "./mistakeQueue";
import { describe, expect, it } from "@jest/globals";
import {
  expectedCribPointsTable,
  expectedPlayPointsTable,
} from "../analysis/analysis.test.common";
import { computeDiscardQualityTrend } from "./discardQualityTrend";
import { createTestPracticeRecord } from "./mistakeQueue.test.common";
import { uniformUncertainty } from "../game/uncertaintySidecar.test.common";

const tables = { crib: expectedCribPointsTable, play: expectedPlayPointsTable };

const sidecarsAt = (standardError: number) => ({
  crib: uniformUncertainty(standardError),
  play: uniformUncertainty(standardError),
});

const judge = (
  record: Pick<NoiseCandidate, "discardKey" | "handKey">,
  standardError = NOISE_STANDARD_ERROR,
): boolean =>
  isRecordedDiscardWithinNoise(record, tables, sidecarsAt(standardError));

const WITHIN_NOISE = new Set([noiseVerdictKey(WITHIN_NOISE_RECORD)]);

const ALL_THREE = noiseTally([
  OPTIMAL_RECORD,
  WITHIN_NOISE_RECORD,
  MISTAKE_RECORD,
]);

describe("recorded discard noise verdicts (#774)", () => {
  /*
   * The last two carry a stored loss that is wrong in both directions, so a
   * verdict read from it rather than recomputed from the hand gets both
   * backwards.
   */
  it.each([
    { expected: true, name: "a 0.09 loss", record: WITHIN_NOISE_RECORD },
    { expected: false, name: "a 0.76 loss", record: MISTAKE_RECORD },
    {
      expected: true,
      name: "a 0.09 loss stored as 5",
      record: { ...WITHIN_NOISE_RECORD, expectedPointsLoss: 5 },
    },
    {
      expected: false,
      name: "a 0.76 loss stored as 0.01",
      record: { ...MISTAKE_RECORD, expectedPointsLoss: 0.01 },
    },
  ])("judges $name against a 0.40 threshold", ({ expected, record }) => {
    expect(judge(record as NoiseCandidate)).toBe(expected);
  });

  it("calls nothing noise when every published error is zero", () => {
    expect(judge(WITHIN_NOISE_RECORD as NoiseCandidate, 0)).toBe(false);
  });

  it.each([
    { discardKey: "KH,KC", handKey: "not a hand", name: "an unreadable hand" },
    {
      discardKey: "AS,2S",
      handKey: WITHIN_NOISE_RECORD.handKey,
      name: "a discard the hand never held",
    },
  ])("keeps the exact verdict for $name", (record) => {
    expect(judge(record, Number.MAX_SAFE_INTEGER)).toBe(false);
  });

  it.each([
    {
      name: "a practice decision",
      record: { ...WITHIN_NOISE_RECORD, isPractice: true },
    },
    { name: "an optimal one", record: OPTIMAL_RECORD },
    {
      name: "a zero loss",
      record: { ...WITHIN_NOISE_RECORD, expectedPointsLoss: 0 },
    },
    {
      name: "one with no recorded discard",
      record: { ...WITHIN_NOISE_RECORD, discardKey: null },
    },
  ])("never asks the noise check about $name", ({ record }) => {
    expect(isNoiseCandidate(record)).toBe(false);
  });

  it("counts a practice row sharing a within-noise key as no decision at all", () => {
    expect(
      countWithinNoise(
        [WITHIN_NOISE_RECORD, { ...WITHIN_NOISE_RECORD, isPractice: true }],
        WITHIN_NOISE,
      ),
    ).toBe(1);
  });

  it("leaves a within-noise decision out of the mistake queue", () => {
    expect(
      buildMistakeQueue(ALL_THREE, WITHIN_NOISE).map((item) => item.handKey),
    ).toStrictEqual([MISTAKE_RECORD.handKey]);
  });

  // Mastered in practice too, as it could have been while the exact verdict still queued it: it is no longer a mistake to have mastered.
  it("flags the within-noise point, and never as mastered", () => {
    const trend = computeDiscardQualityTrend(
      {
        ...ALL_THREE,
        practice: [
          createTestPracticeRecord({
            consecutiveSuccesses: SUCCESSES_FOR_MASTERY,
            handKey: WITHIN_NOISE_RECORD.handKey,
          }),
        ],
      },
      { granularity: "rolling20", withinNoise: WITHIN_NOISE },
    );

    expect(
      trend.decisionPoints.map((point) => [
        point.isWithinNoise,
        point.isMastered,
      ]),
    ).toStrictEqual([
      [false, false],
      [true, false],
      [false, false],
    ]);
  });

  it.each(["rolling20", "month"] as const)(
    "leaves the within-noise decision out of the %s share's denominator",
    (granularity) => {
      const { buckets } = computeDiscardQualityTrend(ALL_THREE, {
        granularity,
        withinNoise: WITHIN_NOISE,
      });

      expect(buckets.map((bucket) => bucket.judgedDecisions)).toStrictEqual([
        2,
      ]);
    },
  );
});
