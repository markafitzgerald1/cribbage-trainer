import { type DiscardDecisionRecord } from "./discardDecisionRecord";
import { isObject } from "./isObject";

export type JudgmentBasis =
  "exact-v1" | "sampling-noise-v1" | "exact-fallback-v1";
export interface SettledAdmission {
  readonly basis: JudgmentBasis;
  readonly eligible: boolean;
}
export type RecordedAdmission = SettledAdmission | "pending";

export const isJudgmentBasis = (value: unknown): value is JudgmentBasis =>
  value === "exact-v1" ||
  value === "sampling-noise-v1" ||
  value === "exact-fallback-v1";

export const normalizeAdmission = (
  value: unknown,
): RecordedAdmission | null => {
  if (value === "pending") {
    return value;
  }
  if (!isObject(value)) {
    return null;
  }
  const candidate = value as Partial<SettledAdmission>;
  return typeof candidate.eligible === "boolean" &&
    isJudgmentBasis(candidate.basis)
    ? { basis: candidate.basis, eligible: candidate.eligible }
    : null;
};

export const exactAdmission = (isOptimal: boolean): SettledAdmission => ({
  basis: isOptimal ? "exact-v1" : "exact-fallback-v1",
  eligible: !isOptimal,
});

export const isAdmittedMistake = (record: DiscardDecisionRecord): boolean => {
  const admission = normalizeAdmission(record.recordedAdmission);
  return (
    !record.isPractice &&
    (admission === null
      ? !record.isOptimal && record.expectedPointsLoss > 0
      : admission !== "pending" && admission.eligible)
  );
};
