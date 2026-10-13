import {
  type RecordedAdmission,
  decisionAdmission,
  isAdmittedMistake,
  normalizeAdmission,
} from "./recordedAdmission";
import {
  clearDiscardTally,
  discardTallyKey,
  recordDiscardDecision,
  recordPracticeAttempt,
  recordSkippedHand,
} from "./discardTally";
import { describe, expect, it } from "@jest/globals";
import { decisionOf } from "./discardTally.test.common";

const laterBasis = "sampling-noise-v2";
const laterAdmission = { basis: laterBasis, eligible: false };
const storedJson = (): string => localStorage.getItem(discardTallyKey) ?? "";
const storedRows = () =>
  JSON.parse(storedJson()) as {
    readonly attemptLog: readonly unknown[];
    readonly records: readonly unknown[];
  };

// Written through this build with a basis it knows, then renamed in storage the way a later build would have written it.
const storeLaterBasisRows = (): void => {
  clearDiscardTally();
  const handKey = "AH,2H,3H,4H,5H,6H|Dealer";
  recordDiscardDecision(
    decisionOf({
      handKey,
      recordedAdmission: { basis: "sampling-noise-v1", eligible: false },
    }),
  );
  recordPracticeAttempt({
    at: 200,
    detail: {
      basis: "sampling-noise-v1",
      discardKey: "AH,2H",
      expectedPointsLoss: 0.5,
      isOptimal: false,
      outcome: "success",
      tableIdentity: null,
    },
    expectedPointsLoss: 0.5,
    handKey,
    isOptimal: false,
  });
  localStorage.setItem(
    discardTallyKey,
    storedJson().replaceAll("sampling-noise-v1", laterBasis),
  );
};

describe("recorded admission validation", () => {
  it.each([null, 0, {}, { basis: "exact-v1", eligible: 1 }])(
    "rejects unknown admission %j",
    (value) => {
      expect(normalizeAdmission(value)).toBeNull();
    },
  );

  const optimalRecord = (recordedAdmission: RecordedAdmission) =>
    decisionOf({ expectedPointsLoss: 0, isOptimal: true, recordedAdmission });

  it.each([
    { expected: false, record: optimalRecord("pending") },
    {
      expected: false,
      record: optimalRecord({ basis: "sampling-noise-v1", eligible: true }),
    },
    {
      expected: false,
      record: optimalRecord({ basis: "exact-v1", eligible: true }),
    },
    {
      expected: true,
      record: decisionOf({
        recordedAdmission: { basis: "exact-fallback-v1", eligible: false },
      }),
    },
  ])(
    "retains the legacy exact eligibility when admission contradicts the recorded verdict: $expected",
    ({ expected, record }) => {
      expect(decisionAdmission(record)).toBeNull();
      expect(isAdmittedMistake(record)).toBe(expected);
    },
  );
});

describe("an admission basis from a later build", () => {
  it("is kept as stored but never read as a verdict", () => {
    const record = decisionOf({ recordedAdmission: laterAdmission });

    expect(normalizeAdmission(laterAdmission)).toStrictEqual(laterAdmission);
    expect(decisionAdmission(record)).toBeNull();
    expect(isAdmittedMistake(record)).toBe(true);
  });

  it("survives an unrelated write byte for byte on both the decision and the attempt", () => {
    storeLaterBasisRows();
    const before = storedRows();
    recordSkippedHand(300);
    const after = storedRows();

    expect(JSON.stringify(before.records)).toContain(laterBasis);
    expect(JSON.stringify(before.attemptLog)).toContain(laterBasis);
    expect(JSON.stringify(after.records)).toBe(JSON.stringify(before.records));
    expect(JSON.stringify(after.attemptLog)).toBe(
      JSON.stringify(before.attemptLog),
    );
  });
});
