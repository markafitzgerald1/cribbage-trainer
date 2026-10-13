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
import {
  decisionOf,
  noiseAdmission,
  noiseJudgedSuccess,
} from "./discardTally.test.common";
import { describe, expect, it } from "@jest/globals";

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
  recordDiscardDecision(decisionOf({ recordedAdmission: noiseAdmission }));
  recordPracticeAttempt(noiseJudgedSuccess(0.5));
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
    {
      expected: true,
      record: decisionOf({ recordedAdmission: laterAdmission }),
    },
  ])(
    "retains the legacy exact eligibility when admission contradicts the recorded verdict or names a basis this build cannot read: $expected",
    ({ expected, record }) => {
      expect(decisionAdmission(record)).toBeNull();
      expect(isAdmittedMistake(record)).toBe(expected);
    },
  );
});

describe("an admission basis from a later build", () => {
  it("is kept as stored", () => {
    expect(normalizeAdmission(laterAdmission)).toStrictEqual(laterAdmission);
  });

  it("survives an unrelated write byte for byte on both the decision and the attempt", () => {
    storeLaterBasisRows();
    const before = storedRows();
    recordSkippedHand(300);
    const after = storedRows();

    const fields = ["records", "attemptLog"] as const;
    const serialized = (rows: ReturnType<typeof storedRows>) =>
      fields.map((field) => JSON.stringify(rows[field]));

    expect(
      serialized(before).map((json) => json.includes(laterBasis)),
    ).toStrictEqual([true, true]);
    expect(serialized(after)).toStrictEqual(serialized(before));
  });
});
