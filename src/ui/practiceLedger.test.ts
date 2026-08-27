/* jscpd:ignore-start */
import {
  type PracticeRecord,
  isStoredPracticeRecord,
  updatePracticeRecords,
} from "./practiceLedger";
import {
  asJson,
  decisionOf,
  storeRaw,
  storedOmitting,
  storedWith,
} from "./discardTally.test.common";
import {
  clearDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "./discardTally";
import { describe, expect, it } from "@jest/globals";

const AT = 1_700_000_000_000;
const VALID_HAND_KEY = "5H,6H,7H,8H,9H,10H|Dealer";

describe("practiceLedger", () => {
  describe("isStoredPracticeRecord", () => {
    it("returns false for non-objects and null", () => {
      expect(isStoredPracticeRecord(null)).toBe(false);
      expect(isStoredPracticeRecord("string")).toBe(false);
      expect(isStoredPracticeRecord(42)).toBe(false);
    });

    it("returns false when numeric count fields or totalWrongLoss are invalid", () => {
      expect(
        isStoredPracticeRecord({
          attempts: 0,
          consecutiveSuccesses: 0,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          wrong: 0,
        }),
      ).toBe(false);

      expect(
        isStoredPracticeRecord({
          attempts: 1,
          consecutiveSuccesses: -1,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          wrong: 0,
        }),
      ).toBe(false);

      expect(
        isStoredPracticeRecord({
          attempts: 1,
          consecutiveSuccesses: 0,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          wrong: -1,
        }),
      ).toBe(false);

      expect(
        isStoredPracticeRecord({
          attempts: 1,
          consecutiveSuccesses: 0,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: -1,
          wrong: 1,
        }),
      ).toBe(false);

      expect(
        isStoredPracticeRecord({
          attempts: 1,
          consecutiveSuccesses: 0,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: "invalid",
          wrong: 1,
        }),
      ).toBe(false);
    });

    it("returns false when handKey is invalid or types are malformed", () => {
      expect(
        isStoredPracticeRecord({
          attempts: 1,
          consecutiveSuccesses: 0,
          handKey: "corruptKey",
          lastAttemptAt: AT,
          wrong: 0,
        }),
      ).toBe(false);

      expect(
        isStoredPracticeRecord({
          attempts: 1,
          consecutiveSuccesses: 0,
          handKey: 123,
          lastAttemptAt: AT,
          wrong: 0,
        }),
      ).toBe(false);

      expect(
        isStoredPracticeRecord({
          attempts: 1,
          consecutiveSuccesses: 0,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: "invalid",
          wrong: 0,
        }),
      ).toBe(false);
    });

    it("returns true for a valid practice record", () => {
      expect(
        isStoredPracticeRecord({
          attempts: 1,
          consecutiveSuccesses: 1,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 0,
          wrong: 0,
        }),
      ).toBe(true);
    });
  });

  describe("updatePracticeRecords", () => {
    it("creates a new record on first optimal attempt", () => {
      const updated = updatePracticeRecords(
        [],
        { at: AT, handKey: VALID_HAND_KEY, isOptimal: true },
        100,
      );

      expect(updated).toStrictEqual([
        {
          attempts: 1,
          consecutiveSuccesses: 1,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 0,
          wrong: 0,
        },
      ]);
    });

    it("creates a new record on first sub-optimal attempt", () => {
      const updated = updatePracticeRecords(
        [],
        {
          at: AT,
          expectedPointsLoss: 1.5,
          handKey: VALID_HAND_KEY,
          isOptimal: false,
        },
        100,
      );

      expect(updated).toStrictEqual([
        {
          attempts: 1,
          consecutiveSuccesses: 0,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 1.5,
          wrong: 1,
        },
      ]);
    });

    it("updates existing record on success", () => {
      const existing: PracticeRecord = {
        attempts: 1,
        consecutiveSuccesses: 0,
        handKey: VALID_HAND_KEY,
        lastAttemptAt: AT - 1000,
        totalWrongLoss: 2.0,
        wrong: 1,
      };

      const updated = updatePracticeRecords(
        [existing],
        { at: AT, handKey: VALID_HAND_KEY, isOptimal: true },
        100,
      );

      expect(updated).toStrictEqual([
        {
          attempts: 2,
          consecutiveSuccesses: 1,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 2.0,
          wrong: 1,
        },
      ]);
    });

    it("resets consecutive successes on wrong attempt and adds to totalWrongLoss", () => {
      const existing: PracticeRecord = {
        attempts: 2,
        consecutiveSuccesses: 1,
        handKey: VALID_HAND_KEY,
        lastAttemptAt: AT - 1000,
        totalWrongLoss: 2.0,
        wrong: 1,
      };

      const updated = updatePracticeRecords(
        [existing],
        {
          at: AT,
          expectedPointsLoss: 1.5,
          handKey: VALID_HAND_KEY,
          isOptimal: false,
        },
        100,
      );

      expect(updated).toStrictEqual([
        {
          attempts: 3,
          consecutiveSuccesses: 0,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 3.5,
          wrong: 2,
        },
      ]);
    });

    it("handles legacy existing records without totalWrongLoss and attempts without expectedPointsLoss", () => {
      const legacy: PracticeRecord = {
        attempts: 1,
        consecutiveSuccesses: 0,
        handKey: VALID_HAND_KEY,
        lastAttemptAt: AT - 1000,
        wrong: 1,
      };

      const updated = updatePracticeRecords(
        [legacy],
        {
          at: AT,
          handKey: VALID_HAND_KEY,
          isOptimal: false,
        },
        100,
      );

      expect(updated).toStrictEqual([
        {
          attempts: 2,
          consecutiveSuccesses: 0,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 0,
          wrong: 2,
        },
      ]);

      const freshNonOptimalWithoutLoss = updatePracticeRecords(
        [],
        {
          at: AT,
          handKey: VALID_HAND_KEY,
          isOptimal: false,
        },
        100,
      );

      expect(freshNonOptimalWithoutLoss).toStrictEqual([
        {
          attempts: 1,
          consecutiveSuccesses: 0,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 0,
          wrong: 1,
        },
      ]);
    });

    it("trims least-recently-attempted records when exceeding maxRecords", () => {
      const initial: PracticeRecord[] = [
        {
          attempts: 1,
          consecutiveSuccesses: 0,
          handKey: "AH,2H,3H,4H,5H,6H|Dealer",
          lastAttemptAt: AT - 5000,
          totalWrongLoss: 1.0,
          wrong: 1,
        },
        {
          attempts: 1,
          consecutiveSuccesses: 0,
          handKey: "2H,3H,4H,5H,6H,7H|Dealer",
          lastAttemptAt: AT - 3000,
          totalWrongLoss: 1.0,
          wrong: 1,
        },
      ];

      const updated = updatePracticeRecords(
        initial,
        { at: AT, handKey: VALID_HAND_KEY, isOptimal: true },
        2,
      );

      expect(updated).toHaveLength(2);
      expect(updated.map((recordItem) => recordItem.handKey)).toStrictEqual([
        "2H,3H,4H,5H,6H,7H|Dealer",
        VALID_HAND_KEY,
      ]);
    });
  });

  describe("storage integration", () => {
    it("records explicit practice attempts into the practice ledger", () => {
      clearDiscardTally();
      recordPracticeAttempt({
        at: AT,
        handKey: VALID_HAND_KEY,
        isOptimal: true,
      });

      expect(readTallyForDisplay().practice).toStrictEqual([
        {
          attempts: 1,
          consecutiveSuccesses: 1,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 0,
          wrong: 0,
        },
      ]);
    });

    it("updates practice ledger when recording practice attempts", () => {
      clearDiscardTally();
      recordDiscardDecision(
        decisionOf({
          expectedPointsLoss: 2,
          handKey: VALID_HAND_KEY,
          isOptimal: false,
        }),
      );

      expect(readTallyForDisplay().practice).toStrictEqual([]);

      recordPracticeAttempt({
        at: AT,
        expectedPointsLoss: 0,
        handKey: VALID_HAND_KEY,
        isOptimal: true,
      });

      expect(readTallyForDisplay().practice).toStrictEqual([
        {
          attempts: 1,
          consecutiveSuccesses: 1,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 0,
          wrong: 0,
        },
      ]);
      expect(readTallyForDisplay().lifetime.decisions).toBe(1);
    });

    it("parses stored practice ledger and filters invalid practice entries", () => {
      storeRaw(
        asJson(
          storedWith({
            practice: [
              {
                attempts: 2,
                consecutiveSuccesses: 1,
                handKey: VALID_HAND_KEY,
                lastAttemptAt: AT,
                totalWrongLoss: 2.0,
                wrong: 1,
              },
              {
                attempts: 0,
                handKey: "invalid",
              },
            ],
          }),
        ),
      );

      expect(readTallyForDisplay().practice).toStrictEqual([
        {
          attempts: 2,
          consecutiveSuccesses: 1,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 2.0,
          wrong: 1,
        },
      ]);
    });

    it("initializes practice array on recordPracticeAttempt when legacy stored tally omits practice", () => {
      storeRaw(asJson(storedOmitting("practice")));

      recordPracticeAttempt({
        at: AT,
        handKey: VALID_HAND_KEY,
        isOptimal: true,
      });

      expect(readTallyForDisplay().practice).toStrictEqual([
        {
          attempts: 1,
          consecutiveSuccesses: 1,
          handKey: VALID_HAND_KEY,
          lastAttemptAt: AT,
          totalWrongLoss: 0,
          wrong: 0,
        },
      ]);
    });
  });
});
/* jscpd:ignore-end */
