/* jscpd:ignore-start */
import {
  type MistakeQueueItem,
  buildMistakeQueue,
  classifyLossQuantile,
  computeLossQuantileThresholds,
  filterMistakeQueue,
  sortMistakeQueue,
} from "./mistakeQueue";
import {
  NOW,
  ONE_DAY_MS,
  createMockTally,
  createTestMistakeRecord,
  createTestPracticeRecord,
  mockItemA,
  mockItemB,
  mockItemMastered,
} from "./mistakeQueue.test.common";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import type { PracticeRecord } from "./practiceLedger";
/* jscpd:ignore-end */

const createSingleHandTally = ({
  mistakeLoss = 1.5,
  practice,
}: {
  mistakeLoss?: number;
  practice?: Partial<PracticeRecord>;
} = {}) => {
  const handKey = "5H,6H,7H,8H,9H,10H|Dealer";
  return createMockTally({
    practice: practice
      ? [createTestPracticeRecord({ handKey, ...practice })]
      : [],
    records: [
      createTestMistakeRecord({
        cribRole: CribRole.Dealer,
        expectedPointsLoss: mistakeLoss,
        handKey,
      }),
    ],
  });
};

const buildSingleQueueItem = (
  options: Parameters<typeof createSingleHandTally>[0],
): MistakeQueueItem => {
  const queue = buildMistakeQueue(createSingleHandTally(options));
  return queue[0] as MistakeQueueItem;
};

describe("mistakeQueue", () => {
  describe("computeLossQuantileThresholds", () => {
    it.each([
      { expected: { highThreshold: 0, mediumThreshold: 0 }, input: [] },
      { expected: { highThreshold: 0, mediumThreshold: 0 }, input: [1.5] },
      {
        expected: { highThreshold: 0, mediumThreshold: 0 },
        input: [1.0, 2.0],
      },
      {
        expected: { highThreshold: 0, mediumThreshold: 0 },
        input: [1.0, 1.0, 2.0],
      },
    ])(
      "returns zero thresholds for collapsed inputs",
      ({ expected, input }) => {
        expect(computeLossQuantileThresholds(input)).toStrictEqual(expected);
      },
    );

    it("computes loss quantile thresholds for sorted loss values", () => {
      const losses = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
      const thresholds = computeLossQuantileThresholds(losses);

      expect(thresholds).toStrictEqual({
        highThreshold: 2.5,
        mediumThreshold: 1.5,
      });
    });

    it("computes thresholds from distinct loss values avoiding empty tiers with repeated minimums", () => {
      expect(
        computeLossQuantileThresholds([1.0, 1.0, 1.0, 2.0, 3.0]),
      ).toStrictEqual({
        highThreshold: 3.0,
        mediumThreshold: 2.0,
      });
    });
  });

  describe("classifyLossQuantile", () => {
    it("returns low when thresholds are zero or collapsed", () => {
      expect(
        classifyLossQuantile(1.5, { highThreshold: 0, mediumThreshold: 0 }),
      ).toBe("low");
      expect(
        classifyLossQuantile(1.5, { highThreshold: 1.5, mediumThreshold: 1.5 }),
      ).toBe("low");
    });

    it("classifies high, medium, and low correctly", () => {
      const thresholds = { highThreshold: 2.0, mediumThreshold: 1.0 };

      expect(classifyLossQuantile(2.5, thresholds)).toBe("high");
      expect(classifyLossQuantile(2.0, thresholds)).toBe("high");
      expect(classifyLossQuantile(1.5, thresholds)).toBe("medium");
      expect(classifyLossQuantile(1.0, thresholds)).toBe("medium");
      expect(classifyLossQuantile(0.5, thresholds)).toBe("low");
    });
  });

  describe("buildMistakeQueue", () => {
    it("returns an empty queue when tally has no records", () => {
      expect(buildMistakeQueue(createMockTally())).toStrictEqual([]);
    });

    it("filters out optimal and practice records", () => {
      const tally = createMockTally({
        records: [
          createTestMistakeRecord({ expectedPointsLoss: 0, isOptimal: true }),
          createTestMistakeRecord({
            cribRole: CribRole.Pone,
            handKey: "5H,6H,7H,8H,9H,10H|Pone",
            isPractice: true,
          }),
        ],
      });

      expect(buildMistakeQueue(tally)).toStrictEqual([]);
    });

    it("silently drops records with invalid handKeys", () => {
      const invalidTally = createMockTally({
        records: [createTestMistakeRecord({ handKey: "corrupt-hand-key" })],
      });

      expect(buildMistakeQueue(invalidTally)).toHaveLength(0);
    });

    it("builds queue items for authentic mistakes without practice records", () => {
      const item = buildSingleQueueItem({ mistakeLoss: 1.5 });

      expect(item).toMatchObject({
        attempts: 1,
        consecutiveSuccesses: 0,
        cribRole: CribRole.Dealer,
        handKey: "5H,6H,7H,8H,9H,10H|Dealer",
        isMastered: false,
        lossIfWrong: 1.5,
        lossQuantile: "low",
        pWrong: 1,
        priority: 1.5,
        wrong: 1,
      });
      expect(item.cards).toHaveLength(6);
    });

    it("joins with practice ledger and marks mastered when consecutive successes reach 2", () => {
      const item = buildSingleQueueItem({
        mistakeLoss: 2.0,
        practice: {
          attempts: 3,
          consecutiveSuccesses: 2,
          totalWrongLoss: 2.0,
          wrong: 1,
        },
      });

      expect(item).toMatchObject({
        attempts: 4,
        consecutiveSuccesses: 2,
        isMastered: true,
        lossIfWrong: 2.0,
        pWrong: 0.5,
        priority: 1.0,
        wrong: 2,
      });
    });

    it("computes priority as expected points loss (lossIfWrong * pWrong)", () => {
      const item = buildSingleQueueItem({
        mistakeLoss: 2.0,
        practice: {
          attempts: 1,
          totalWrongLoss: 2.0,
          wrong: 1,
        },
      });

      expect(item.priority).toBe(2.0);
    });

    it("pools practice attempt losses with original mistake loss", () => {
      const item = buildSingleQueueItem({
        mistakeLoss: 1.0,
        practice: {
          attempts: 2,
          totalWrongLoss: 3.0,
          wrong: 1,
        },
      });

      expect(item).toMatchObject({
        attempts: 3,
        lossIfWrong: 2.0,
        wrong: 2,
      });
      expect(item.pWrong).toBeCloseTo(2 / 3);
      expect(item.priority).toBeCloseTo((2 / 3) * 2.0);
    });

    it("sets lastAttemptAt to the max of practice and authentic mistake times", () => {
      const item = buildSingleQueueItem({
        mistakeLoss: 1.5,
        practice: {
          lastAttemptAt: NOW - 5 * ONE_DAY_MS,
        },
      });

      expect(item.lastAttemptAt).toBe(NOW - ONE_DAY_MS);
    });

    it("collapses multiple records with the same handKey", () => {
      const handKey = "5H,6H,7H,8H,9H,10H|Dealer";
      const tally = createMockTally({
        records: [
          createTestMistakeRecord({
            at: NOW - ONE_DAY_MS,
            handKey,
          }),
          createTestMistakeRecord({
            at: NOW - 2 * ONE_DAY_MS,
            handKey,
          }),
          createTestMistakeRecord({
            at: NOW,
            handKey,
          }),
        ],
      });
      const tallyWithoutPractice = {
        lifetime: tally.lifetime,
        records: tally.records,
        revision: tally.revision,
        skipped: tally.skipped,
        version: tally.version,
      };

      expect(buildMistakeQueue(tallyWithoutPractice as never)).toHaveLength(1);
    });
  });

  describe("filterMistakeQueue", () => {
    const mockItems: MistakeQueueItem[] = [
      mockItemA,
      mockItemMastered,
      mockItemB,
    ];

    it("filters by status", () => {
      expect(
        filterMistakeQueue(mockItems, { statusFilter: "all" }),
      ).toHaveLength(3);
      expect(
        filterMistakeQueue(mockItems, { statusFilter: "active" }),
      ).toHaveLength(2);
      expect(
        filterMistakeQueue(mockItems, { statusFilter: "mastered" }),
      ).toHaveLength(1);
    });

    it("filters by crib role", () => {
      expect(filterMistakeQueue(mockItems, { roleFilter: "all" })).toHaveLength(
        3,
      );
      expect(
        filterMistakeQueue(mockItems, { roleFilter: "dealer" }),
      ).toHaveLength(2);
      expect(
        filterMistakeQueue(mockItems, { roleFilter: "pone" }),
      ).toHaveLength(1);
    });

    it("filters by loss quantile", () => {
      expect(
        filterMistakeQueue(mockItems, { quantileFilter: "all" }),
      ).toHaveLength(3);
      expect(
        filterMistakeQueue(mockItems, { quantileFilter: "high" }),
      ).toHaveLength(2);
      expect(
        filterMistakeQueue(mockItems, { quantileFilter: "medium" }),
      ).toHaveLength(1);
      expect(
        filterMistakeQueue(mockItems, { quantileFilter: "low" }),
      ).toHaveLength(0);
    });
  });

  describe("sortMistakeQueue", () => {
    it("sorts by priority descending across all items", () => {
      const sorted = sortMistakeQueue(
        [mockItemA, mockItemMastered, mockItemB],
        "priority",
      );

      expect(sorted[0]?.handKey).toBe(mockItemB.handKey);
      expect(sorted[1]?.handKey).toBe(mockItemMastered.handKey);
      expect(sorted[2]?.handKey).toBe(mockItemA.handKey);
    });

    it("sorts by highest loss", () => {
      const sorted = sortMistakeQueue(
        [mockItemA, mockItemB, mockItemMastered],
        "highestLoss",
      );

      expect(sorted.map((item) => item.handKey)).toStrictEqual([
        mockItemMastered.handKey,
        mockItemB.handKey,
        mockItemA.handKey,
      ]);
    });

    it.each([
      {
        description: "priority ties using lossIfWrong",
        item1: { ...mockItemA, lossIfWrong: 1.0, priority: 1.0 },
        item2: { ...mockItemB, lossIfWrong: 2.0, priority: 1.0 },
        order: "priority" as const,
      },
      {
        description: "highestLoss ties using priority",
        item1: { ...mockItemA, lossIfWrong: 2.0, priority: 1.0 },
        item2: { ...mockItemB, lossIfWrong: 2.0, priority: 2.0 },
        order: "highestLoss" as const,
      },
      {
        description: "mostRecent ties using priority",
        item1: { ...mockItemA, lastAttemptAt: NOW, priority: 1.0 },
        item2: { ...mockItemB, lastAttemptAt: NOW, priority: 2.0 },
        order: "mostRecent" as const,
      },
    ])("breaks $description", ({ item1, item2, order }) => {
      const sorted = sortMistakeQueue([item1, item2], order);

      expect(sorted[0]?.handKey).toBe(item2.handKey);
    });

    it("breaks ties deterministically across all sort orders", () => {
      const itemTie1: MistakeQueueItem = {
        ...mockItemA,
        handKey: "AH,2H,3H,4H,5H,6H|Dealer",
        lastAttemptAt: NOW,
        lossIfWrong: 2.0,
        originalDecisionAt: NOW,
        priority: 1.0,
      };
      const itemTie2: MistakeQueueItem = {
        ...mockItemB,
        handKey: "KH,QH,JH,10H,9H,8H|Dealer",
        lastAttemptAt: NOW,
        lossIfWrong: 2.0,
        originalDecisionAt: NOW,
        priority: 1.0,
      };

      const byLoss = sortMistakeQueue([itemTie2, itemTie1], "highestLoss");

      expect(byLoss[0]?.handKey).toBe(itemTie1.handKey);

      const byRecent = sortMistakeQueue([itemTie2, itemTie1], "mostRecent");

      expect(byRecent[0]?.handKey).toBe(itemTie1.handKey);

      const byPriority = sortMistakeQueue([itemTie2, itemTie1], "priority");

      expect(byPriority[0]?.handKey).toBe(itemTie1.handKey);

      const masteredTie1: MistakeQueueItem = {
        ...itemTie1,
        isMastered: true,
      };
      const masteredTie2: MistakeQueueItem = {
        ...itemTie2,
        isMastered: true,
      };
      const byPriorityMastered = sortMistakeQueue(
        [masteredTie2, masteredTie1],
        "priority",
      );

      expect(byPriorityMastered[0]?.handKey).toBe(masteredTie1.handKey);
    });
  });
});
