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
import { createTestPracticeRecord } from "./mistakeQueue.test.common";
/* jscpd:ignore-end */

const AT = 1_700_000_000_000;
const VALID_HAND_KEY = "5H,6H,7H,8H,9H,10H|Dealer";

const makeRecord = (overrides?: Partial<PracticeRecord>): PracticeRecord =>
  createTestPracticeRecord({
    handKey: VALID_HAND_KEY,
    lastAttemptAt: AT,
    ...overrides,
  });

const singleSuccessRecord = makeRecord({ consecutiveSuccesses: 1 });

const twoAttemptSuccessRecord = makeRecord({
  attempts: 2,
  consecutiveSuccesses: 1,
  totalWrongLoss: 2.0,
  wrong: 1,
});

const performUpdate = ({
  at = AT,
  expectedPointsLoss,
  handKey = VALID_HAND_KEY,
  initial = [],
  isOptimal = true,
  maxRecords = 100,
}: {
  at?: number;
  expectedPointsLoss?: number;
  handKey?: string;
  initial?: PracticeRecord[];
  isOptimal?: boolean;
  maxRecords?: number;
} = {}) =>
  updatePracticeRecords(
    initial,
    typeof expectedPointsLoss === "number"
      ? { at, expectedPointsLoss, handKey, isOptimal }
      : { at, handKey, isOptimal },
    maxRecords,
  );

const expectUpdateResult = (
  initial: PracticeRecord[],
  update: Parameters<typeof performUpdate>[0],
  expected: PracticeRecord[],
): boolean => {
  const actual = performUpdate({ initial, ...update });
  return JSON.stringify(actual) === JSON.stringify(expected);
};

const recordTestAttempt = (
  overrides?: Partial<Parameters<typeof recordPracticeAttempt>[0]>,
) =>
  recordPracticeAttempt({
    at: AT,
    handKey: VALID_HAND_KEY,
    isOptimal: true,
    ...overrides,
  });

const expectPracticeLedger = (expected: PracticeRecord[]): boolean => {
  const actual = readTallyForDisplay().practice;
  return JSON.stringify(actual) === JSON.stringify(expected);
};

describe("practiceLedger", () => {
  describe("isStoredPracticeRecord", () => {
    it("returns false for non-objects and null", () => {
      expect(isStoredPracticeRecord(null)).toBe(false);
      expect(isStoredPracticeRecord("string")).toBe(false);
      expect(isStoredPracticeRecord(42)).toBe(false);
    });

    it.each([
      { attempts: 0 },
      { attempts: 1.5 },
      { attempts: Infinity },
      { consecutiveSuccesses: -1 },
      { consecutiveSuccesses: 0.5 },
      { consecutiveSuccesses: Infinity },
      { wrong: -1 },
      { wrong: 0.5 },
      { wrong: NaN },
    ])("rejects malformed count values %j", (overrides) => {
      expect(isStoredPracticeRecord(makeRecord(overrides))).toBe(false);
    });

    it("returns false when counts violate attempt bounds", () => {
      expect(isStoredPracticeRecord(makeRecord({ wrong: 2 }))).toBe(false);
      expect(
        isStoredPracticeRecord(makeRecord({ consecutiveSuccesses: 2 })),
      ).toBe(false);
    });

    it.each([
      { totalWrongLoss: -1, wrong: 1 },
      { totalWrongLoss: Infinity, wrong: 1 },
      { totalWrongLoss: NaN, wrong: 1 },
      { totalWrongLoss: "invalid", wrong: 1 },
      { handKey: "corruptKey" },
      { handKey: 123 },
      { lastAttemptAt: "invalid" },
      { lastAttemptAt: -1 },
      { lastAttemptAt: Infinity },
      { lastAttemptAt: NaN },
    ])("rejects invalid metadata and loss %j", (overrides) => {
      expect(isStoredPracticeRecord({ ...makeRecord(), ...overrides })).toBe(
        false,
      );
    });

    it("returns true for a valid practice record", () => {
      expect(isStoredPracticeRecord(singleSuccessRecord)).toBe(true);
    });
  });

  describe("updatePracticeRecords", () => {
    it("creates a new record on first optimal attempt", () => {
      const updated = performUpdate({ isOptimal: true });

      expect(updated).toStrictEqual([singleSuccessRecord]);
    });

    it("creates a new record on first sub-optimal attempt", () => {
      const updated = performUpdate({
        expectedPointsLoss: 1.5,
        isOptimal: false,
      });

      expect(updated).toStrictEqual([
        makeRecord({ totalWrongLoss: 1.5, wrong: 1 }),
      ]);
    });

    it("updates existing record on success", () => {
      const existing = makeRecord({
        lastAttemptAt: AT - 1000,
        totalWrongLoss: 2.0,
        wrong: 1,
      });

      const matched = expectUpdateResult([existing], { isOptimal: true }, [
        twoAttemptSuccessRecord,
      ]);

      expect(matched).toBe(true);
    });

    it("resets consecutive successes on wrong attempt and adds to totalWrongLoss", () => {
      const matched = expectUpdateResult(
        [twoAttemptSuccessRecord],
        { expectedPointsLoss: 1.5, isOptimal: false },
        [
          makeRecord({
            attempts: 3,
            consecutiveSuccesses: 0,
            totalWrongLoss: 3.5,
            wrong: 2,
          }),
        ],
      );

      expect(matched).toBe(true);
    });

    it("handles legacy existing records without totalWrongLoss and attempts without expectedPointsLoss", () => {
      const legacy: PracticeRecord = {
        attempts: 1,
        consecutiveSuccesses: 0,
        handKey: VALID_HAND_KEY,
        lastAttemptAt: AT - 1000,
        wrong: 1,
      };

      const matched = expectUpdateResult([legacy], { isOptimal: false }, [
        makeRecord({
          attempts: 2,
          consecutiveSuccesses: 0,
          totalWrongLoss: 0,
          wrong: 2,
        }),
      ]);

      expect(matched).toBe(true);

      const freshNonOptimalWithoutLoss = performUpdate({ isOptimal: false });

      expect(freshNonOptimalWithoutLoss).toStrictEqual([
        makeRecord({
          totalWrongLoss: 0,
          wrong: 1,
        }),
      ]);
    });

    it("trims least-recently-attempted records when exceeding maxRecords", () => {
      const initial: PracticeRecord[] = [
        makeRecord({
          handKey: "AH,2H,3H,4H,5H,6H|Dealer",
          lastAttemptAt: AT - 5000,
          totalWrongLoss: 1.0,
          wrong: 1,
        }),
        makeRecord({
          handKey: "2H,3H,4H,5H,6H,7H|Dealer",
          lastAttemptAt: AT - 3000,
          totalWrongLoss: 1.0,
          wrong: 1,
        }),
      ];

      const updated = performUpdate({
        initial,
        isOptimal: true,
        maxRecords: 2,
      });

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
      recordTestAttempt();

      expect(readTallyForDisplay().practice).toHaveLength(1);
      expect(readTallyForDisplay().practice[0]).toStrictEqual(
        singleSuccessRecord,
      );
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

      expect(expectPracticeLedger([])).toBe(true);

      recordTestAttempt({ expectedPointsLoss: 0 });

      expect(expectPracticeLedger([singleSuccessRecord])).toBe(true);
      expect(readTallyForDisplay().lifetime.decisions).toBe(1);
    });

    it("parses stored practice ledger and filters invalid practice entries", () => {
      storeRaw(
        asJson(
          storedWith({
            practice: [
              twoAttemptSuccessRecord,
              {
                attempts: 0,
                handKey: "invalid",
              },
            ],
          }),
        ),
      );

      expect(expectPracticeLedger([twoAttemptSuccessRecord])).toBe(true);
    });

    it("initializes practice array on recordPracticeAttempt when legacy stored tally omits practice", () => {
      storeRaw(asJson(storedOmitting("practice")));
      recordTestAttempt();

      expect(readTallyForDisplay().practice).toStrictEqual([
        singleSuccessRecord,
      ]);
    });
  });
});
