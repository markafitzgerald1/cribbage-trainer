import {
  buildContinuousDecisionPoints,
  countRollingSkips,
  masteredHandKeysOf,
} from "./discardQualityTrendRolling";
import { decisionOf, noiseAdmission } from "./discardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import { createTestPracticeRecord } from "./mistakeQueue.test.common";

const masteredKeys = (...handKeys: string[]): ReadonlySet<string> =>
  masteredHandKeysOf(
    handKeys.map((handKey) =>
      createTestPracticeRecord({ consecutiveSuccesses: 2, handKey }),
    ),
  );

describe("masteredHandKeysOf", () => {
  it("keeps only the hands with two or more consecutive successes", () => {
    const keys = masteredHandKeysOf([
      createTestPracticeRecord({ consecutiveSuccesses: 2, handKey: "twice" }),
      createTestPracticeRecord({ consecutiveSuccesses: 3, handKey: "thrice" }),
      createTestPracticeRecord({ consecutiveSuccesses: 1, handKey: "once" }),
    ]);

    expect([...keys].sort()).toStrictEqual(["thrice", "twice"]);
  });

  it("is empty when nothing has been drilled", () => {
    expect(masteredHandKeysOf([]).size).toBe(0);
  });
});

describe("buildContinuousDecisionPoints mastered marking", () => {
  const records = [
    decisionOf({ expectedPointsLoss: 0.5, handKey: "since-mastered" }),
    decisionOf({ expectedPointsLoss: 0.4, handKey: "still-open" }),
    decisionOf({
      expectedPointsLoss: 0,
      handKey: "since-mastered",
      isOptimal: true,
    }),
  ];

  it("marks a sub-optimal decision whose hand is now mastered", () => {
    const points = buildContinuousDecisionPoints(records, 20, {
      masteredHandKeys: masteredKeys("since-mastered"),
    });

    // The optimal decision on the same hand is never mastered: nothing was wrong.
    expect(points.map((point) => point.isMastered)).toStrictEqual([
      true,
      false,
      false,
    ]);
  });

  it("marks nothing mastered without a mastered-key set", () => {
    const points = buildContinuousDecisionPoints(records, 20);

    expect(points.every((point) => !point.isMastered)).toBe(true);
  });

  it("requires both an admitted mistake and a valid hand key for practice eligibility", () => {
    const validHandKey = "5H,6H,7H,8H,9H,10H|Dealer";
    const points = buildContinuousDecisionPoints(
      [
        decisionOf({ expectedPointsLoss: 0.5, handKey: validHandKey }),
        decisionOf({ expectedPointsLoss: 0.5, handKey: "still-open" }),
        decisionOf({
          expectedPointsLoss: 0,
          handKey: validHandKey,
          isOptimal: true,
        }),
      ],
      20,
    );

    expect(points.map((point) => point.isPracticeEligible)).toStrictEqual([
      true,
      false,
      false,
    ]);
  });
});

describe("buildContinuousDecisionPoints within-noise marking (#774)", () => {
  const validHandKey = "5H,6H,7H,8H,9H,10H|Dealer";

  it("handles empty arrays for continuous decision points and rolling skips", () => {
    expect(buildContinuousDecisionPoints([], 20)).toStrictEqual([]);
    expect(countRollingSkips([], 20, [{ at: 1000 }])).toStrictEqual([]);
  });

  it("marks a decision recorded as within noise, never as mastered or to practice", () => {
    const [point] = buildContinuousDecisionPoints(
      [
        decisionOf({
          handKey: validHandKey,
          recordedAdmission: noiseAdmission,
        }),
      ],
      20,
      { masteredHandKeys: masteredKeys(validHandKey) },
    );

    expect(point).toStrictEqual(
      expect.objectContaining({
        isMastered: false,
        isPracticeEligible: false,
        isWithinNoise: true,
      }),
    );
  });

  it("leaves recorded mistakes, legacy, pending and zero-loss decisions outside the noise", () => {
    const points = buildContinuousDecisionPoints(
      [
        decisionOf({
          recordedAdmission: { ...noiseAdmission, eligible: true },
        }),
        decisionOf({ handKey: "legacy" }),
        decisionOf({ recordedAdmission: "pending" }),
        decisionOf({ expectedPointsLoss: 0, isOptimal: false }),
      ],
      20,
    );

    expect(points.map((point) => point.isWithinNoise)).toStrictEqual([
      false,
      false,
      false,
      false,
    ]);
  });
});
