import { parseHandKey } from "./handKey";

export interface PracticeRecord {
  readonly attempts: number;
  readonly consecutiveSuccesses: number;
  readonly handKey: string;
  readonly lastAttemptAt: number;
  readonly totalWrongLoss: number;
  readonly wrong: number;
}

export type PracticeAttempt =
  | {
      readonly at: number;
      readonly expectedPointsLoss?: undefined;
      readonly handKey: string;
      readonly isOptimal: true;
    }
  | {
      readonly at: number;
      readonly expectedPointsLoss: number;
      readonly handKey: string;
      readonly isOptimal: false;
    };

interface MaybePracticeRecord {
  readonly attempts?: unknown;
  readonly consecutiveSuccesses?: unknown;
  readonly handKey?: unknown;
  readonly lastAttemptAt?: unknown;
  readonly totalWrongLoss?: unknown;
  readonly wrong?: unknown;
}

const isCountBoundedBy = (count: unknown, max: number): count is number =>
  typeof count === "number" &&
  Number.isInteger(count) &&
  count >= 0 &&
  count <= max;

const isValidTotalWrongLoss = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const hasConsistentWrongLoss = (
  wrong: number,
  totalWrongLoss: number,
): boolean => (wrong === 0) === (totalWrongLoss === 0);

export const isStoredPracticeRecord = (
  value: unknown,
): value is PracticeRecord => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as MaybePracticeRecord;
  const isAttemptsValid =
    typeof candidate.attempts === "number" &&
    Number.isInteger(candidate.attempts) &&
    candidate.attempts > 0;
  if (!isAttemptsValid) {
    return false;
  }

  return (
    typeof candidate.handKey === "string" &&
    isCountBoundedBy(candidate.wrong, candidate.attempts) &&
    isCountBoundedBy(candidate.consecutiveSuccesses, candidate.attempts) &&
    typeof candidate.lastAttemptAt === "number" &&
    Number.isFinite(candidate.lastAttemptAt) &&
    candidate.lastAttemptAt >= 0 &&
    isValidTotalWrongLoss(candidate.totalWrongLoss) &&
    hasConsistentWrongLoss(candidate.wrong, candidate.totalWrongLoss) &&
    parseHandKey(candidate.handKey) !== null
  );
};

const isValidAttempt = (attempt: unknown): attempt is PracticeAttempt => {
  if (typeof attempt !== "object" || attempt === null) {
    return false;
  }
  const candidate = attempt as Partial<PracticeAttempt>;
  if (
    typeof candidate.handKey !== "string" ||
    parseHandKey(candidate.handKey) === null ||
    typeof candidate.at !== "number" ||
    !Number.isFinite(candidate.at) ||
    candidate.at < 0
  ) {
    return false;
  }
  if (candidate.isOptimal === true) {
    return (
      !("expectedPointsLoss" in candidate) ||
      typeof candidate.expectedPointsLoss === "undefined"
    );
  }
  if (candidate.isOptimal === false) {
    return (
      typeof candidate.expectedPointsLoss === "number" &&
      Number.isFinite(candidate.expectedPointsLoss) &&
      candidate.expectedPointsLoss > 0
    );
  }
  return false;
};

const computeConsecutiveSuccesses = (
  existing: PracticeRecord | undefined,
  attempt: PracticeAttempt,
): number => {
  if (!attempt.isOptimal) {
    return 0;
  }
  return (existing?.consecutiveSuccesses ?? 0) + 1;
};

export const updatePracticeRecords = (
  practice: readonly PracticeRecord[],
  attempt: PracticeAttempt,
  maxRecords: number,
): readonly PracticeRecord[] => {
  if (!isValidAttempt(attempt) || maxRecords <= 0) {
    return practice;
  }
  const existing = practice.find(
    (recordItem) => recordItem.handKey === attempt.handKey,
  );
  const loss = attempt.isOptimal ? 0 : attempt.expectedPointsLoss;
  const consecutiveSuccesses = computeConsecutiveSuccesses(existing, attempt);
  const nextRecord: PracticeRecord = existing
    ? {
        attempts: existing.attempts + 1,
        consecutiveSuccesses,
        handKey: attempt.handKey,
        lastAttemptAt: Math.max(existing.lastAttemptAt, attempt.at),
        totalWrongLoss: existing.totalWrongLoss + loss,
        wrong: existing.wrong + (attempt.isOptimal ? 0 : 1),
      }
    : {
        attempts: 1,
        consecutiveSuccesses,
        handKey: attempt.handKey,
        lastAttemptAt: attempt.at,
        totalWrongLoss: loss,
        wrong: attempt.isOptimal ? 0 : 1,
      };

  const remaining = practice.filter(
    (recordItem) => recordItem.handKey !== attempt.handKey,
  );
  const updated = [...remaining, nextRecord];
  if (updated.length <= maxRecords) {
    return updated;
  }
  return [...updated]
    .sort((one, other) => one.lastAttemptAt - other.lastAttemptAt)
    .slice(-maxRecords);
};
