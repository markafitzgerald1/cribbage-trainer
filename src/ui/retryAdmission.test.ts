import {
  clearDiscardTally,
  discardTallyKey,
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "./discardTally";
import { describe, expect, it, jest } from "@jest/globals";
import type { PracticeAttempt } from "./practiceLedger";
import { buildMistakeQueue } from "./mistakeQueue";
import { decisionOf } from "./discardTally.test.common";
import { encodeTableIdentities } from "./tableIdentityCodec";

const pairA = {
  crib: { means_sha256: "a".repeat(64) },
  play: { means_sha256: "b".repeat(64) },
};
const pairB = { ...pairA, play: { means_sha256: "c".repeat(64) } };
const handKey = "AH,2H,3H,4H,5H,6H|Dealer";
const retry = (identity = pairA, isOptimal = true): PracticeAttempt => {
  const detail = {
    basis: "exact-v1" as const,
    discardKey: "AH,2H",
    expectedPointsLoss: isOptimal ? 0 : 0.5,
    isOptimal,
    outcome: isOptimal ? ("success" as const) : ("failure" as const),
    tableIdentity: identity,
  };
  const common = { at: 100, detail, handKey };
  return isOptimal
    ? { ...common, isOptimal: true }
    : { ...common, expectedPointsLoss: 0.5, isOptimal: false };
};

const seedFullAttemptLog = (): void => {
  clearDiscardTally();
  const first = retry();
  const log = Array.from({ length: 1_000 }, (_, index) => ({
    ...first.detail!,
    at: 100,
    handKey,
    order: index + 1,
  }));
  const stored = {
    ...readTallyForDisplay(),
    attemptLog: log,
    practice: [
      {
        attempts: 1_000,
        consecutiveSuccesses: 1_000,
        handKey,
        lastAttemptAt: 1_000,
        totalWrongLoss: 0,
        wrong: 0,
      },
    ],
  };
  localStorage.setItem(
    discardTallyKey,
    JSON.stringify(encodeTableIdentities(stored)),
  );
};

describe("frozen retry and admission evidence", () => {
  it("two successful retries under different tables master an item, each logged attempt keeps the tables it was judged under, and a later miss resets the streak", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf({ handKey, tableIdentity: pairA }));
    recordPracticeAttempt(retry());
    recordPracticeAttempt(retry(pairB));

    expect(buildMistakeQueue(readTallyForDisplay())[0]?.isMastered).toBe(true);
    expect(
      readTallyForDisplay().attemptLog?.map((entry) => entry.tableIdentity),
    ).toStrictEqual([pairA, pairB]);

    recordPracticeAttempt(retry(pairB, false));

    expect(
      buildMistakeQueue(readTallyForDisplay())[0]?.consecutiveSuccesses,
    ).toBe(0);
    expect(readTallyForDisplay().attemptLog).toHaveLength(3);
  });

  it("keeps new settled within-noise decisions out without changing their positive exact loss", () => {
    clearDiscardTally();
    recordDiscardDecision(
      decisionOf({
        handKey,
        recordedAdmission: { basis: "sampling-noise-v1", eligible: false },
      }),
    );

    expect(readTallyForDisplay().records[0]?.expectedPointsLoss).toBe(1.5);
    expect(buildMistakeQueue(readTallyForDisplay())).toStrictEqual([]);
  });

  it("does not queue a pending admission and settles it only once under its original pair", () => {
    clearDiscardTally();
    const decision = decisionOf({
      handKey,
      recordedAdmission: "pending",
      tableIdentity: pairA,
    });
    recordDiscardDecision(decision);

    expect(buildMistakeQueue(readTallyForDisplay())).toStrictEqual([]);

    recordDiscardDecision({
      ...decision,
      recordedAdmission: { basis: "sampling-noise-v1", eligible: false },
      tableIdentity: pairB,
    });

    expect(readTallyForDisplay().records[0]?.recordedAdmission).toBe("pending");

    recordDiscardDecision({
      ...decision,
      recordedAdmission: { basis: "exact-fallback-v1", eligible: true },
    });
    recordDiscardDecision({
      ...decision,
      recordedAdmission: { basis: "sampling-noise-v1", eligible: false },
    });

    expect(buildMistakeQueue(readTallyForDisplay())).toHaveLength(1);
    expect(readTallyForDisplay().records[0]?.recordedAdmission).toStrictEqual({
      basis: "exact-fallback-v1",
      eligible: true,
    });
  });
});

describe("retry retention and quota", () => {
  it("reads an attempt without a registry as unknown provenance and never invents earlier individual retries", () => {
    clearDiscardTally();
    const detail = retry().detail!;
    localStorage.setItem(
      discardTallyKey,
      JSON.stringify({
        ...readTallyForDisplay(),
        attemptLog: [
          { ...detail, at: 100, handKey, order: 1, tableIdentity: null },
        ],
      }),
    );

    expect(readTallyForDisplay().attemptLog?.[0]?.tableIdentity).toBeNull();
    expect(readTallyForDisplay().attemptLog).toHaveLength(1);
  });

  it("trims individual attempts while keeping streaks, counts and monotonic order across clock rollback", () => {
    seedFullAttemptLog();
    recordPracticeAttempt({ ...retry(pairB), at: 1 });
    const tally = readTallyForDisplay();

    expect(tally.attemptLog).toHaveLength(1_000);
    expect(tally.attemptLog?.[0]?.order).toBe(2);
    expect(tally.attemptLog?.at(-1)).toMatchObject({
      at: 1,
      order: 1_001,
      tableIdentity: pairB,
    });
    expect(tally.practice[0]).toMatchObject({
      attempts: 1_001,
      consecutiveSuccesses: 1_001,
      lastAttemptAt: 1_001,
    });
  });

  it("uses one atomic write, retains session attempts after quota failure, and flushes them on recovery", () => {
    seedFullAttemptLog();
    const writes = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("quota", "QuotaExceededError");
      });
    try {
      recordPracticeAttempt(retry());
      recordPracticeAttempt(retry(pairB));

      const session = readTallyForDisplay();

      expect(writes).toHaveBeenCalledTimes(2);
      expect({
        aggregateAttempts: session.practice[0]?.attempts,
        orders: session.attemptLog?.map((entry) => entry.order),
      }).toStrictEqual({
        aggregateAttempts: 1_002,
        orders: Array.from({ length: 1_000 }, (_, index) => index + 3),
      });

      writes.mockRestore();
      recordPracticeAttempt(retry(pairB, false));

      expect(
        readTallyForDisplay().attemptLog?.map((entry) => entry.order),
      ).toStrictEqual(Array.from({ length: 1_000 }, (_, index) => index + 4));

      const durable = JSON.parse(
        localStorage.getItem(discardTallyKey) as string,
      ) as { attemptLog: readonly unknown[] };

      expect(durable.attemptLog).toHaveLength(1_000);
    } finally {
      writes.mockRestore();
    }

    expect(readTallyForDisplay().practice[0]).toMatchObject({
      attempts: 1_003,
      consecutiveSuccesses: 0,
      wrong: 1,
    });
  });

  it("updates aggregate success from the final outcome without losing a positive exact noise loss", () => {
    clearDiscardTally();
    const attempt = retry(pairB, false);
    recordPracticeAttempt({
      ...attempt,
      detail: {
        ...attempt.detail!,
        basis: "sampling-noise-v1",
        outcome: "success",
      },
    });

    expect(readTallyForDisplay().practice[0]).toMatchObject({
      consecutiveSuccesses: 1,
      wrong: 0,
    });
    expect(readTallyForDisplay().attemptLog?.[0]).toMatchObject({
      expectedPointsLoss: 0.5,
      isOptimal: false,
      outcome: "success",
    });
  });

  it("does not let a malformed individual retry alter aggregate mastery", () => {
    clearDiscardTally();
    recordPracticeAttempt(retry());
    const valid = readTallyForDisplay();
    recordPracticeAttempt({
      ...retry(),
      detail: { ...retry().detail!, discardKey: "AH,2S" },
    });

    expect(readTallyForDisplay()).toStrictEqual(valid);
  });
});
