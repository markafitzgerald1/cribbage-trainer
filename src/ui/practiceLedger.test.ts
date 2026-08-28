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
  readDiscardTally,
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
  expectedPointsLoss = 1.0,
  handKey = VALID_HAND_KEY,
  initial = [],
  isOptimal = true,
  maxRecords = 100,
}: {
  at?: number;
  expectedPointsLoss?: number;
  handKey?: string;
  initial?: readonly PracticeRecord[];
  isOptimal?: boolean;
  maxRecords?: number;
} = {}) =>
  updatePracticeRecords(
    initial,
    isOptimal
      ? { at, handKey, isOptimal: true }
      : { at, expectedPointsLoss, handKey, isOptimal: false },
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

const recordTestAttempt = () =>
  recordPracticeAttempt({
    at: AT,
    handKey: VALID_HAND_KEY,
    isOptimal: true,
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
      { name: "zero attempts", overrides: { attempts: 0 } },
      { name: "fractional attempts", overrides: { attempts: 1.5 } },
      { name: "infinite attempts", overrides: { attempts: Infinity } },
      {
        name: "negative consecutive successes",
        overrides: { consecutiveSuccesses: -1 },
      },
      {
        name: "fractional consecutive successes",
        overrides: { consecutiveSuccesses: 0.5 },
      },
      {
        name: "infinite consecutive successes",
        overrides: { consecutiveSuccesses: Infinity },
      },
      { name: "negative wrong count", overrides: { wrong: -1 } },
      { name: "fractional wrong count", overrides: { wrong: 0.5 } },
      { name: "NaN wrong count", overrides: { wrong: NaN } },
      {
        name: "a streak with no successful attempts",
        overrides: {
          attempts: 2,
          consecutiveSuccesses: 2,
          totalWrongLoss: 2,
          wrong: 2,
        },
      },
      {
        name: "a partial streak after no wrong attempts",
        overrides: {
          attempts: 2,
          consecutiveSuccesses: 1,
          totalWrongLoss: 0,
          wrong: 0,
        },
      },
    ])("rejects invalid stored practice record: $name", ({ overrides }) => {
      expect(isStoredPracticeRecord(makeRecord(overrides))).toBe(false);
    });

    it("returns false when counts violate attempt bounds", () => {
      expect(isStoredPracticeRecord(makeRecord({ wrong: 2 }))).toBe(false);
      expect(
        isStoredPracticeRecord(makeRecord({ consecutiveSuccesses: 2 })),
      ).toBe(false);
    });

    it.each([
      { totalWrongLoss: -1 },
      { totalWrongLoss: Infinity },
      { totalWrongLoss: NaN },
      { totalWrongLoss: "invalid" },
      { totalWrongLoss: 0, wrong: 1 },
      { totalWrongLoss: 1, wrong: 0 },
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

    it("rejects records omitting totalWrongLoss", () => {
      const incompleteRecord: Partial<PracticeRecord> = { ...makeRecord() };
      Reflect.deleteProperty(incompleteRecord, "totalWrongLoss");

      expect(isStoredPracticeRecord(incompleteRecord)).toBe(false);
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

    it.each([
      {
        attempt: { isOptimal: true },
        description: "updates an existing record on success",
        expected: twoAttemptSuccessRecord,
        initial: [
          makeRecord({
            lastAttemptAt: AT - 1000,
            totalWrongLoss: 2.0,
            wrong: 1,
          }),
        ],
      },
      {
        attempt: { expectedPointsLoss: 1.5, isOptimal: false },
        description:
          "resets consecutive successes on wrong attempt and adds to totalWrongLoss",
        expected: makeRecord({
          attempts: 3,
          consecutiveSuccesses: 0,
          lastAttemptAt: AT + 1,
          totalWrongLoss: 3.5,
          wrong: 2,
        }),
        initial: [twoAttemptSuccessRecord],
      },
      {
        attempt: { expectedPointsLoss: 1.5, isOptimal: false },
        description:
          "accumulates loss on non-optimal attempt for existing record",
        expected: makeRecord({
          attempts: 2,
          consecutiveSuccesses: 0,
          totalWrongLoss: 2.5,
          wrong: 2,
        }),
        initial: [
          makeRecord({
            attempts: 1,
            consecutiveSuccesses: 0,
            lastAttemptAt: AT - 1000,
            totalWrongLoss: 1.0,
            wrong: 1,
          }),
        ],
      },
    ])("$description", ({ attempt, expected, initial }) => {
      const matched = expectUpdateResult(initial, attempt, [expected]);

      expect(matched).toBe(true);
    });

    it.each([
      {
        description: "when the new attempt is most recent",
        expectedHandKeys: ["2H,3H,4H,5H,6H,7H|Dealer", VALID_HAND_KEY],
        expectedLastAttemptAt: AT,
        firstAttemptAt: AT - 5000,
        secondAttemptAt: AT - 3000,
      },
      {
        description: "after a clock rollback",
        expectedHandKeys: ["AH,2H,3H,4H,5H,6H|Dealer", VALID_HAND_KEY],
        expectedLastAttemptAt: AT + 5001,
        firstAttemptAt: AT + 5000,
        secondAttemptAt: AT + 3000,
      },
    ])(
      "retains the latest practice evidence $description",
      ({
        expectedHandKeys,
        expectedLastAttemptAt,
        firstAttemptAt,
        secondAttemptAt,
      }) => {
        const initial: PracticeRecord[] = [
          makeRecord({
            handKey: "AH,2H,3H,4H,5H,6H|Dealer",
            lastAttemptAt: firstAttemptAt,
            totalWrongLoss: 1.0,
            wrong: 1,
          }),
          makeRecord({
            handKey: "2H,3H,4H,5H,6H,7H|Dealer",
            lastAttemptAt: secondAttemptAt,
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
        expect(updated.map((recordItem) => recordItem.handKey)).toStrictEqual(
          expectedHandKeys,
        );
        expect(
          updated.find((recordItem) => recordItem.handKey === VALID_HAND_KEY),
        ).toMatchObject({ lastAttemptAt: expectedLastAttemptAt });
      },
    );

    it("retains a practiced existing record after a clock rollback at capacity", () => {
      const subsequentHandKey = "2H,3H,4H,5H,6H,7H|Dealer";
      const initial: PracticeRecord[] = [
        makeRecord({
          handKey: "AH,2H,3H,4H,5H,6H|Dealer",
          lastAttemptAt: AT + 5000,
          totalWrongLoss: 1.0,
          wrong: 1,
        }),
        makeRecord({
          lastAttemptAt: AT + 3000,
          totalWrongLoss: 1.0,
          wrong: 1,
        }),
      ];

      const updatedExisting = performUpdate({
        initial,
        isOptimal: true,
        maxRecords: 2,
      });
      const updated = performUpdate({
        handKey: subsequentHandKey,
        initial: updatedExisting,
        isOptimal: true,
        maxRecords: 2,
      });

      expect(updated.map((recordItem) => recordItem.handKey)).toStrictEqual([
        VALID_HAND_KEY,
        subsequentHandKey,
      ]);
      expect(updated[0]).toMatchObject({
        attempts: 2,
        lastAttemptAt: AT + 5001,
      });
    });

    it.each([
      { at: -1 },
      { at: NaN },
      { at: Infinity },
      { at: "invalid" as unknown as number },
      { expectedPointsLoss: 1.0, isOptimal: true },
      { expectedPointsLoss: -1, isOptimal: false },
      { expectedPointsLoss: 0, isOptimal: false },
      { expectedPointsLoss: NaN, isOptimal: false },
      { expectedPointsLoss: Infinity, isOptimal: false },
      { expectedPointsLoss: "invalid" as unknown as number, isOptimal: false },
      { handKey: "corruptKey" },
      { handKey: "" },
      { handKey: 123 as unknown as string },
      { isOptimal: "invalid" as unknown as boolean },
      { isOptimal: "" as unknown as boolean },
    ])(
      "rejects malformed attempt payload %j without mutating practice ledger",
      (overrides) => {
        const initial = [singleSuccessRecord];
        const attempt = {
          at: AT,
          expectedPointsLoss: 1.0,
          handKey: VALID_HAND_KEY,
          isOptimal: false,
          ...overrides,
        } as Parameters<typeof updatePracticeRecords>[1];

        const result = updatePracticeRecords(initial, attempt, 100);

        expect(result).toBe(initial);
      },
    );

    it.each([null, "invalid"])(
      "rejects non-object attempt %j without mutating practice ledger",
      (nonObjectAttempt) => {
        const initial = [singleSuccessRecord];
        const result = updatePracticeRecords(
          initial,
          nonObjectAttempt as unknown as Parameters<
            typeof updatePracticeRecords
          >[1],
          100,
        );

        expect(result).toBe(initial);
      },
    );

    it("rejects attempt when maxRecords is non-positive", () => {
      const initial = [singleSuccessRecord];
      const result = updatePracticeRecords(
        initial,
        { at: AT, handKey: VALID_HAND_KEY, isOptimal: true },
        0,
      );

      expect(result).toBe(initial);
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
          at: AT - 1000,
          expectedPointsLoss: 2,
          handKey: VALID_HAND_KEY,
          isOptimal: false,
        }),
      );

      expect(expectPracticeLedger([])).toBe(true);

      recordTestAttempt();

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

    it.each([
      {
        attempt: {
          at: AT,
          expectedPointsLoss: 1.5,
          handKey: VALID_HAND_KEY,
          isOptimal: false as const,
        },
        expectedConsecutive: 0,
        expectedLastAttemptAt: AT + 5001,
        expectedWrong: 1,
      },
      {
        attempt: {
          at: AT,
          handKey: VALID_HAND_KEY,
          isOptimal: true as const,
        },
        expectedConsecutive: 2,
        expectedLastAttemptAt: AT + 5001,
        expectedWrong: 0,
      },
    ])(
      "orders later-recorded outcomes ahead of a clock rollback while updating the streak",
      ({
        attempt,
        expectedConsecutive,
        expectedLastAttemptAt,
        expectedWrong,
      }) => {
        const initial: PracticeRecord[] = [
          makeRecord({
            attempts: 1,
            consecutiveSuccesses: 1,
            handKey: VALID_HAND_KEY,
            lastAttemptAt: AT + 5000,
            totalWrongLoss: 0,
            wrong: 0,
          }),
        ];

        const updated = updatePracticeRecords(initial, attempt, 100);

        expect(updated[0]?.lastAttemptAt).toBe(expectedLastAttemptAt);
        expect(updated[0]?.consecutiveSuccesses).toBe(expectedConsecutive);
        expect(updated[0]?.wrong).toBe(expectedWrong);
        expect(updated[0]?.attempts).toBe(2);
      },
    );

    it("initializes practice array on recordPracticeAttempt when legacy stored tally omits practice", () => {
      storeRaw(asJson(storedOmitting("practice")));
      recordTestAttempt();

      expect(readTallyForDisplay().practice).toStrictEqual([
        singleSuccessRecord,
      ]);
    });

    it.each([
      { attempt: { at: -1, handKey: "invalid", isOptimal: true } },
      { attempt: { at: AT, handKey: "invalid", isOptimal: true } },
    ])(
      "does not mutate storage when recordPracticeAttempt receives invalid attempt %j",
      ({ attempt }) => {
        clearDiscardTally();
        const initialTally = readTallyForDisplay();
        const initialSummary = readDiscardTally(Date.now());

        const summary = recordPracticeAttempt(
          attempt as unknown as Parameters<typeof recordPracticeAttempt>[0],
        );

        expect(readTallyForDisplay()).toStrictEqual(initialTally);
        expect(summary.todayDecisions).toBe(initialSummary.todayDecisions);
      },
    );
  });
});
