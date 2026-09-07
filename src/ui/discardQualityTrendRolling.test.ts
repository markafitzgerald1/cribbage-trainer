import {
  buildContinuousDecisionPoints,
  masteredHandKeysOf,
} from "./discardQualityTrendRolling";
import { describe, expect, it } from "@jest/globals";
import { createTestPracticeRecord } from "./mistakeQueue.test.common";
import { decisionOf } from "./discardTally.test.common";

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
});
