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
  mockItemA,
  mockItemB,
  mockItemMastered,
} from "./mistakeQueue.test.common";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";

describe("mistakeQueue", () => {
  describe("computeLossQuantileThresholds", () => {
    it("returns zero thresholds when given empty losses", () => {
      expect(computeLossQuantileThresholds([])).toStrictEqual({
        highThreshold: 0,
        mediumThreshold: 0,
      });
    });

    it("computes loss quantile thresholds for sorted loss values", () => {
      const losses = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
      const thresholds = computeLossQuantileThresholds(losses);

      expect(thresholds).toStrictEqual({
        highThreshold: 2.5,
        mediumThreshold: 1.5,
      });
    });

    it("handles single-element or equal-element arrays", () => {
      expect(computeLossQuantileThresholds([1.5])).toStrictEqual({
        highThreshold: 0,
        mediumThreshold: 0,
      });
    });

    it("returns zero thresholds when fewer than 3 unique loss values exist or thresholds collapse", () => {
      expect(computeLossQuantileThresholds([1.0, 2.0])).toStrictEqual({
        highThreshold: 0,
        mediumThreshold: 0,
      });
      expect(computeLossQuantileThresholds([1.0, 1.0, 2.0])).toStrictEqual({
        highThreshold: 0,
        mediumThreshold: 0,
      });
      expect(
        computeLossQuantileThresholds([1.0, 2.0, 2.0, 2.0, 2.0, 3.0]),
      ).toStrictEqual({
        highThreshold: 0,
        mediumThreshold: 0,
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
          {
            at: NOW - ONE_DAY_MS,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 0,
            handKey: "5H,6H,7H,8H,9H,10H|Dealer",
            isOptimal: true,
            isPractice: false,
          },
          {
            at: NOW - ONE_DAY_MS,
            cribRole: CribRole.Pone,
            discardKey: "5H,6H",
            expectedPointsLoss: 1.5,
            handKey: "5H,6H,7H,8H,9H,10H|Pone",
            isOptimal: false,
            isPractice: true,
          },
        ],
      });

      expect(buildMistakeQueue(tally)).toStrictEqual([]);
    });

    it("silently drops records with invalid handKeys", () => {
      const tally = createMockTally({
        records: [
          {
            at: NOW - ONE_DAY_MS,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 1.5,
            handKey: "invalidHandKey",
            isOptimal: false,
            isPractice: false,
          },
        ],
      });

      expect(buildMistakeQueue(tally)).toStrictEqual([]);
    });

    it("builds queue items for authentic mistakes without practice records", () => {
      const tally = createMockTally({
        records: [
          {
            at: NOW - ONE_DAY_MS,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 1.5,
            handKey: "5H,6H,7H,8H,9H,10H|Dealer",
            isOptimal: false,
            isPractice: false,
          },
        ],
      });

      const queue = buildMistakeQueue(tally);

      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        attempts: 1,
        consecutiveSuccesses: 0,
        cribRole: CribRole.Dealer,
        handKey: "5H,6H,7H,8H,9H,10H|Dealer",
        isMastered: false,
        lastAttemptAt: NOW - ONE_DAY_MS,
        lossIfWrong: 1.5,
        lossQuantile: "low",
        originalDecisionAt: NOW - ONE_DAY_MS,
        pWrong: 1,
        previousDiscard: "5H,6H",
        wrong: 1,
      });
      expect(queue[0]?.priority).toBe(1.5);
      expect(queue[0]?.cards).toHaveLength(6);
    });

    it("joins with practice ledger and marks mastered when consecutive successes reach 2", () => {
      const handKey = "5H,6H,7H,8H,9H,10H|Dealer";
      const tally = createMockTally({
        practice: [
          {
            attempts: 3,
            consecutiveSuccesses: 2,
            handKey,
            lastAttemptAt: NOW,
            totalWrongLoss: 2.0,
            wrong: 1,
          },
        ],
        records: [
          {
            at: NOW - 5 * ONE_DAY_MS,
            cribRole: CribRole.Dealer,
            discardKey: null,
            expectedPointsLoss: 2.0,
            handKey,
            isOptimal: false,
            isPractice: false,
          },
        ],
      });

      const queue = buildMistakeQueue(tally);

      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        attempts: 4,
        consecutiveSuccesses: 2,
        isMastered: true,
        lastAttemptAt: NOW,
        lossIfWrong: 2.0,
        pWrong: 0.5,
        previousDiscard: null,
        priority: 0,
        wrong: 2,
      });
    });

    it("computes priority as expected points loss (lossIfWrong * pWrong)", () => {
      const handKey = "5H,6H,7H,8H,9H,10H|Dealer";
      const tally = createMockTally({
        practice: [
          {
            attempts: 1,
            consecutiveSuccesses: 0,
            handKey,
            lastAttemptAt: NOW,
            totalWrongLoss: 2.0,
            wrong: 1,
          },
        ],
        records: [
          {
            at: NOW - ONE_DAY_MS,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 2.0,
            handKey,
            isOptimal: false,
            isPractice: false,
          },
        ],
      });

      const queue = buildMistakeQueue(tally);

      expect(queue).toHaveLength(1);
      expect(queue[0]?.priority).toBe(2.0);
    });

    it("pools practice attempt losses with original mistake loss", () => {
      const handKey = "5H,6H,7H,8H,9H,10H|Dealer";
      const tally = createMockTally({
        practice: [
          {
            attempts: 2,
            consecutiveSuccesses: 0,
            handKey,
            lastAttemptAt: NOW,
            totalWrongLoss: 3.0,
            wrong: 1,
          },
        ],
        records: [
          {
            at: NOW - ONE_DAY_MS,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 1.0,
            handKey,
            isOptimal: false,
            isPractice: false,
          },
        ],
      });

      const queue = buildMistakeQueue(tally);

      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        attempts: 3,
        lossIfWrong: 2.0,
        wrong: 2,
      });
      expect(queue[0]?.pWrong).toBeCloseTo(2 / 3);
      expect(queue[0]?.priority).toBeCloseTo((2 / 3) * 2.0);
    });

    it("collapses multiple records with the same handKey", () => {
      const handKey = "5H,6H,7H,8H,9H,10H|Dealer";
      const tally = createMockTally({
        records: [
          {
            at: NOW - 2 * ONE_DAY_MS,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 1.5,
            handKey,
            isOptimal: false,
            isPractice: false,
          },
          {
            at: NOW - ONE_DAY_MS,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 1.5,
            handKey,
            isOptimal: false,
            isPractice: false,
          },
        ],
      });

      expect(buildMistakeQueue(tally)).toHaveLength(1);
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
    it("sorts by priority by default putting unmastered first", () => {
      const sorted = sortMistakeQueue(
        [mockItemA, mockItemMastered, mockItemB],
        "priority",
      );

      expect(sorted[0]?.handKey).toBe(mockItemB.handKey);
      expect(sorted[1]?.handKey).toBe(mockItemA.handKey);
      expect(sorted[2]?.handKey).toBe(mockItemMastered.handKey);
    });

    it("sorts by highest loss", () => {
      const sorted = sortMistakeQueue(
        [mockItemA, mockItemB, mockItemMastered],
        "highestLoss",
      );

      expect(sorted[0]?.handKey).toBe(mockItemMastered.handKey);
      expect(sorted[1]?.handKey).toBe(mockItemB.handKey);
      expect(sorted[2]?.handKey).toBe(mockItemA.handKey);
    });

    it("sorts by most recent", () => {
      const sorted = sortMistakeQueue(
        [mockItemA, mockItemB, mockItemMastered],
        "mostRecent",
      );

      expect(sorted[0]?.handKey).toBe(mockItemMastered.handKey);
      expect(sorted[1]?.handKey).toBe(mockItemB.handKey);
      expect(sorted[2]?.handKey).toBe(mockItemA.handKey);
    });

    it("breaks ties deterministically across all sort orders", () => {
      const itemTie1: MistakeQueueItem = {
        ...mockItemA,
        handKey: "AH,2H,3H,4H,5H,6H|Dealer",
        lastAttemptAt: NOW,
        lossIfWrong: 2.0,
        priority: 1.0,
      };
      const itemTie2: MistakeQueueItem = {
        ...mockItemB,
        handKey: "KH,QH,JH,10H,9H,8H|Dealer",
        lastAttemptAt: NOW,
        lossIfWrong: 2.0,
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
/* jscpd:ignore-end */
