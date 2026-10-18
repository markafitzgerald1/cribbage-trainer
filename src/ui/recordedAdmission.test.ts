import {
  type RecordedAdmission,
  decisionAdmission,
  isAdmittedMistake,
  isRecordedWithinNoise,
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
const optimalRecord = (recordedAdmission: RecordedAdmission) =>
  decisionOf({ expectedPointsLoss: 0, isOptimal: true, recordedAdmission });
// An exact fallback admitting nothing for a decision that lost points: contradictory metadata.
const CONTRADICTED_FALLBACK = decisionOf({
  recordedAdmission: { basis: "exact-fallback-v1", eligible: false },
});
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
      record: CONTRADICTED_FALLBACK,
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

  it.each(["deferred-v2", { basis: laterBasis, eligible: "maybe" }])(
    "keeps an admission of a shape this build cannot read, %j, through an unrelated write",
    (laterShape) => {
      clearDiscardTally();
      recordDiscardDecision(decisionOf({ recordedAdmission: "pending" }));
      const rows = JSON.parse(storedJson()) as {
        records: { recordedAdmission: unknown }[];
      };
      rows.records[0] = { ...rows.records[0], recordedAdmission: laterShape };
      localStorage.setItem(discardTallyKey, JSON.stringify(rows));
      recordSkippedHand(300);

      expect(storedRows().records[0]).toStrictEqual(
        expect.objectContaining({ recordedAdmission: laterShape }),
      );
    },
  );
});

describe("a decision recorded as within simulation noise (#774)", () => {
  it.each([
    {
      expected: true,
      name: "a noise-settled mistake",
      record: decisionOf({ recordedAdmission: noiseAdmission }),
    },
    {
      expected: false,
      name: "a noise-settled mistake outside the threshold",
      record: decisionOf({
        recordedAdmission: { ...noiseAdmission, eligible: true },
      }),
    },
    {
      expected: false,
      name: "a pending decision",
      record: decisionOf({ recordedAdmission: "pending" }),
    },
    {
      expected: false,
      name: "a legacy decision with no admission",
      record: decisionOf(),
    },
    {
      expected: false,
      name: "a later build's basis",
      record: decisionOf({ recordedAdmission: laterAdmission }),
    },
    {
      expected: false,
      name: "an exact fallback that contradicts its own verdict",
      record: CONTRADICTED_FALLBACK,
    },
    {
      expected: false,
      name: "a practice decision",
      record: decisionOf({
        isPractice: true,
        recordedAdmission: noiseAdmission,
      }),
    },
    {
      expected: false,
      name: "a best choice",
      record: decisionOf({
        expectedPointsLoss: 0,
        isOptimal: true,
        recordedAdmission: { basis: "exact-v1", eligible: false },
      }),
    },
    {
      expected: false,
      name: "a best choice with positive recorded loss",
      record: {
        ...optimalRecord({ basis: "exact-v1", eligible: false }),
        expectedPointsLoss: 0.15,
      },
    },
    {
      expected: false,
      name: "a sub-optimal discard that lost nothing",
      record: decisionOf({
        expectedPointsLoss: 0,
        recordedAdmission: { basis: "exact-fallback-v1", eligible: false },
      }),
    },
  ])("is $expected for $name", ({ expected, record }) => {
    expect(isRecordedWithinNoise(record)).toBe(expected);
  });
});
