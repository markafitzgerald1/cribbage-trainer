import {
  type RecordedAdmission,
  decisionAdmission,
  isAdmittedMistake,
  normalizeAdmission,
} from "./recordedAdmission";
import { describe, expect, it } from "@jest/globals";
import { decisionOf } from "./discardTally.test.common";

describe("recorded admission validation", () => {
  it.each([
    null,
    0,
    {},
    { basis: "future", eligible: true },
    { basis: "exact-v1", eligible: 1 },
  ])("rejects unknown admission %j", (value) => {
    expect(normalizeAdmission(value)).toBeNull();
  });

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
