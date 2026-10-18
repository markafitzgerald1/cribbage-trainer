import { type DiscardDecisionRecord } from "./discardDecisionRecord";
import { isObject } from "./isObject";

export type JudgmentBasis =
  "exact-v1" | "sampling-noise-v1" | "exact-fallback-v1";
export interface SettledAdmission {
  readonly basis: JudgmentBasis;
  readonly eligible: boolean;
}
/*
 * An admission naming a basis this build cannot interpret, such as a later
 * build's revision of the noise rule. It is kept exactly as stored, so an
 * unrelated write here never rewrites a judgment this build did not make,
 * but nothing here reads its verdict: the queue treats it as it treats
 * contradictory metadata.
 */
export interface ForeignAdmission {
  readonly basis: string;
  readonly eligible: boolean;
}
export type RecordedAdmission = SettledAdmission | ForeignAdmission | "pending";
/*
 * How a pending decision is settled at its deadline, judged from whatever
 * sidecars have arrived by then. The analysis that recorded the decision
 * supplies it, so leaving that analysis early cannot change the verdict.
 */
export type DeadlineJudgment = () => SettledAdmission;

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
  const candidate = value as Partial<ForeignAdmission>;
  return typeof candidate.eligible === "boolean" &&
    typeof candidate.basis === "string"
    ? (candidate as ForeignAdmission)
    : null;
};

export const exactAdmission = (isOptimal: boolean): SettledAdmission => ({
  basis: isOptimal ? "exact-v1" : "exact-fallback-v1",
  eligible: !isOptimal,
});

export const decisionAdmission = (
  record: Pick<
    DiscardDecisionRecord,
    "recordedAdmission" | "isOptimal" | "expectedPointsLoss"
  >,
): RecordedAdmission | null => {
  const admission = normalizeAdmission(record.recordedAdmission);
  const mistake = !record.isOptimal && record.expectedPointsLoss > 0;
  if (admission === "pending") return mistake ? admission : null;
  if (admission === null || !isJudgmentBasis(admission.basis)) return null;
  if (admission.basis === "sampling-noise-v1") {
    return mistake ? admission : null;
  }
  return admission.eligible === mistake ? admission : null;
};

export const isAdmittedMistake = (record: DiscardDecisionRecord): boolean => {
  const admission = decisionAdmission(record);
  return (
    !record.isPractice &&
    (admission === null
      ? !record.isOptimal && record.expectedPointsLoss > 0
      : admission !== "pending" && admission.eligible)
  );
};

/*
 * The caption's "Within noise", as recorded when the decision was made: a
 * loss the noise rule settled as not worth practicing. Pending, contradictory
 * and foreign admissions are not, so those decisions keep their exact
 * verdict. Never re-judged under the tables installed now (#894).
 */
export const isRecordedWithinNoise = (
  record: DiscardDecisionRecord,
): boolean => {
  const admission = decisionAdmission(record);
  return (
    !record.isPractice &&
    !record.isOptimal &&
    record.expectedPointsLoss > 0 &&
    admission !== null &&
    admission !== "pending" &&
    !admission.eligible
  );
};
