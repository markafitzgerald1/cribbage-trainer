/* jscpd:ignore-start */
import {
  type MistakeQueueItem,
  buildMistakeQueue,
  classifyLossQuantile,
  computeLossQuantileThresholds,
  filterMistakeQueue,
  sortMistakeQueue,
} from "./mistakeQueue";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import type { StoredTally } from "./discardTally";
import { parseHand } from "../game/Card";

const NOW = 1_700_000_000_000;
const ONE_DAY_MS = 86_400_000;

const createMockTally = (
  overrides: Partial<StoredTally> = {},
): StoredTally => ({
  lifetime: {
    decisions: 0,
    expectedPointsLossTotal: 0,
    optimalDecisions: 0,
    skippedHands: 0,
  },
  practice: [],
  records: [],
  revision: 1,
  skipped: [],
  version: 3,
  ...overrides,
});

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
        highThreshold: 1.5,
        mediumThreshold: 1.5,
      });
    });

    it("collapses thresholds when fewer than 3 unique loss values exist", () => {
      expect(computeLossQuantileThresholds([1.0, 2.0])).toStrictEqual({
        highThreshold: 2.0,
        mediumThreshold: 2.0,
      });
      expect(computeLossQuantileThresholds([1.0, 1.0, 2.0])).toStrictEqual({
        highThreshold: 2.0,
        mediumThreshold: 2.0,
      });
    });
  });

  describe("classifyLossQuantile", () => {
    it("returns high when highThreshold equals mediumThreshold", () => {
      expect(
        classifyLossQuantile(1.5, { highThreshold: 1.5, mediumThreshold: 1.5 }),
      ).toBe("high");
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
      expect(buildMistakeQueue(createMockTally(), NOW)).toStrictEqual([]);
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

      expect(buildMistakeQueue(tally, NOW)).toStrictEqual([]);
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

      expect(buildMistakeQueue(tally, NOW)).toStrictEqual([]);
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

      const queue = buildMistakeQueue(tally, NOW);

      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        attempts: 1,
        consecutiveSuccesses: 0,
        cribRole: CribRole.Dealer,
        handKey: "5H,6H,7H,8H,9H,10H|Dealer",
        isMastered: false,
        lastAttemptAt: NOW - ONE_DAY_MS,
        lossIfWrong: 1.5,
        lossQuantile: "high",
        originalDecisionAt: NOW - ONE_DAY_MS,
        pWrong: 1,
        previousDiscard: "5H,6H",
        wrong: 1,
      });
      expect(queue[0]?.priority).toBeGreaterThan(0);
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

      const queue = buildMistakeQueue(tally, NOW);

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

    it("clamps future lastAttemptAt timestamp interval to 0", () => {
      const handKey = "5H,6H,7H,8H,9H,10H|Dealer";
      const tally = createMockTally({
        records: [
          {
            at: NOW + ONE_DAY_MS,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 2.0,
            handKey,
            isOptimal: false,
            isPractice: false,
          },
        ],
      });

      const queue = buildMistakeQueue(tally, NOW);

      expect(queue).toHaveLength(1);
      expect(queue[0]?.priority).toBe(2.0);
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

      expect(buildMistakeQueue(tally, NOW)).toHaveLength(1);
    });
  });

  describe("filterMistakeQueue", () => {
    const mockItems: MistakeQueueItem[] = [
      {
        attempts: 1,
        cards: parseHand("5H,6H,7H,8H,9H,10H"),
        consecutiveSuccesses: 0,
        cribRole: CribRole.Dealer,
        handKey: "5H,6H,7H,8H,9H,10H|Dealer",
        isMastered: false,
        lastAttemptAt: NOW - ONE_DAY_MS,
        lossIfWrong: 2.5,
        lossQuantile: "high",
        originalDecisionAt: NOW - ONE_DAY_MS,
        pWrong: 1,
        previousDiscard: "5H,6H",
        priority: 2.0,
        wrong: 1,
      },
      {
        attempts: 3,
        cards: parseHand("AH,2H,3H,4H,5H,6H"),
        consecutiveSuccesses: 2,
        cribRole: CribRole.Pone,
        handKey: "AH,2H,3H,4H,5H,6H|Pone",
        isMastered: true,
        lastAttemptAt: NOW,
        lossIfWrong: 1.2,
        lossQuantile: "medium",
        originalDecisionAt: NOW - 5 * ONE_DAY_MS,
        pWrong: 0.33,
        previousDiscard: "AH,2H",
        priority: 0,
        wrong: 1,
      },
      {
        attempts: 2,
        cards: parseHand("2C,3C,4C,5C,6C,7C"),
        consecutiveSuccesses: 0,
        cribRole: CribRole.Dealer,
        handKey: "2C,3C,4C,5C,6C,7C|Dealer",
        isMastered: false,
        lastAttemptAt: NOW - 2 * ONE_DAY_MS,
        lossIfWrong: 0.4,
        lossQuantile: "low",
        originalDecisionAt: NOW - 2 * ONE_DAY_MS,
        pWrong: 1,
        previousDiscard: null,
        priority: 0.4,
        wrong: 2,
      },
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
      ).toHaveLength(1);
      expect(
        filterMistakeQueue(mockItems, { quantileFilter: "medium" }),
      ).toHaveLength(1);
      expect(
        filterMistakeQueue(mockItems, { quantileFilter: "low" }),
      ).toHaveLength(1);
    });
  });

  describe("sortMistakeQueue", () => {
    const itemA: MistakeQueueItem = {
      attempts: 1,
      cards: parseHand("5H,6H,7H,8H,9H,10H"),
      consecutiveSuccesses: 0,
      cribRole: CribRole.Dealer,
      handKey: "5H,6H,7H,8H,9H,10H|Dealer",
      isMastered: false,
      lastAttemptAt: NOW - 2 * ONE_DAY_MS,
      lossIfWrong: 1.0,
      lossQuantile: "medium",
      originalDecisionAt: NOW - 2 * ONE_DAY_MS,
      pWrong: 1,
      previousDiscard: "5H,6H",
      priority: 0.8,
      wrong: 1,
    };

    const itemB: MistakeQueueItem = {
      attempts: 1,
      cards: parseHand("2C,3C,4C,5C,6C,7C"),
      consecutiveSuccesses: 0,
      cribRole: CribRole.Dealer,
      handKey: "2C,3C,4C,5C,6C,7C|Dealer",
      isMastered: false,
      lastAttemptAt: NOW - ONE_DAY_MS,
      lossIfWrong: 2.0,
      lossQuantile: "high",
      originalDecisionAt: NOW - ONE_DAY_MS,
      pWrong: 1,
      previousDiscard: null,
      priority: 1.9,
      wrong: 1,
    };

    const itemMastered: MistakeQueueItem = {
      attempts: 3,
      cards: parseHand("AH,2H,3H,4H,5H,6H"),
      consecutiveSuccesses: 2,
      cribRole: CribRole.Pone,
      handKey: "AH,2H,3H,4H,5H,6H|Pone",
      isMastered: true,
      lastAttemptAt: NOW,
      lossIfWrong: 3.0,
      lossQuantile: "high",
      originalDecisionAt: NOW - 5 * ONE_DAY_MS,
      pWrong: 0.33,
      previousDiscard: "AH,2H",
      priority: 0,
      wrong: 1,
    };

    it("sorts by priority by default putting unmastered first", () => {
      const sorted = sortMistakeQueue([itemA, itemMastered, itemB], "priority");

      expect(sorted[0]?.handKey).toBe(itemB.handKey);
      expect(sorted[1]?.handKey).toBe(itemA.handKey);
      expect(sorted[2]?.handKey).toBe(itemMastered.handKey);
    });

    it("sorts by highest loss", () => {
      const sorted = sortMistakeQueue(
        [itemA, itemB, itemMastered],
        "highestLoss",
      );

      expect(sorted[0]?.handKey).toBe(itemMastered.handKey);
      expect(sorted[1]?.handKey).toBe(itemB.handKey);
      expect(sorted[2]?.handKey).toBe(itemA.handKey);
    });

    it("sorts by most recent", () => {
      const sorted = sortMistakeQueue(
        [itemA, itemB, itemMastered],
        "mostRecent",
      );

      expect(sorted[0]?.handKey).toBe(itemMastered.handKey);
      expect(sorted[1]?.handKey).toBe(itemB.handKey);
      expect(sorted[2]?.handKey).toBe(itemA.handKey);
    });

    it("breaks ties deterministically across all sort orders", () => {
      const itemTie1: MistakeQueueItem = {
        ...itemA,
        handKey: "AH,2H,3H,4H,5H,6H|Dealer",
        lastAttemptAt: NOW,
        lossIfWrong: 2.0,
        priority: 1.0,
      };
      const itemTie2: MistakeQueueItem = {
        ...itemB,
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

      const masteredTie1 = { ...itemTie1, isMastered: true };
      const masteredTie2 = { ...itemTie2, isMastered: true };
      const byPriorityMastered = sortMistakeQueue(
        [masteredTie2, masteredTie1],
        "priority",
      );

      expect(byPriorityMastered[0]?.handKey).toBe(masteredTie1.handKey);
    });
  });
});
/* jscpd:ignore-end */
