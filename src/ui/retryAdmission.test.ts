import {
  clearDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "./discardTally";
import type { PracticeAttempt } from "./practiceLedger";
import { decisionOf } from "./discardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import { buildMistakeQueue } from "./mistakeQueue";

const pairA = {
  crib: { means_sha256: "a".repeat(64) },
  play: { means_sha256: "b".repeat(64) },
};
const pairB = { ...pairA, play: { means_sha256: "c".repeat(64) } };
const handKey = "AH,2H,3H,4H,5H,6H|Dealer";
const retry = (identity = pairA, isOptimal = true): PracticeAttempt => {
  const detail = {
    discardKey: "AH,2H",
    expectedPointsLoss: isOptimal ? 0 : 0.5,
    isOptimal,
    tableIdentity: identity,
    outcome: isOptimal ? ("success" as const) : ("failure" as const),
    basis: "exact-v1" as const,
  };
  const common = { at: 100, handKey, detail };
  return isOptimal
    ? { ...common, isOptimal: true }
    : { ...common, isOptimal: false, expectedPointsLoss: 0.5 };
};

describe("frozen retry and admission evidence", () => {
  it("retains both attempt stamps while A success plus B success masters and B miss unmasters", () => {
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
        recordedAdmission: { eligible: false, basis: "sampling-noise-v1" },
      }),
    );
    expect(readTallyForDisplay().records[0]?.expectedPointsLoss).toBe(1.5);
    expect(buildMistakeQueue(readTallyForDisplay())).toStrictEqual([]);
  });

  it("does not queue a pending admission and settles it only once under its original pair", () => {
    clearDiscardTally();
    const decision = decisionOf({
      handKey,
      tableIdentity: pairA,
      recordedAdmission: "pending",
    });
    recordDiscardDecision(decision);
    expect(buildMistakeQueue(readTallyForDisplay())).toStrictEqual([]);
    recordDiscardDecision({
      ...decision,
      tableIdentity: pairB,
      recordedAdmission: { eligible: false, basis: "sampling-noise-v1" },
    });
    expect(readTallyForDisplay().records[0]?.recordedAdmission).toBe("pending");
    recordDiscardDecision({
      ...decision,
      recordedAdmission: { eligible: true, basis: "exact-fallback-v1" },
    });
    recordDiscardDecision({
      ...decision,
      recordedAdmission: { eligible: false, basis: "sampling-noise-v1" },
    });
    expect(buildMistakeQueue(readTallyForDisplay())).toHaveLength(1);
    expect(readTallyForDisplay().records[0]?.recordedAdmission).toStrictEqual({
      eligible: true,
      basis: "exact-fallback-v1",
    });
  });
});
