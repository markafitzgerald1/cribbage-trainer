import { parseHandKey } from "./handKey";

export interface PracticeRecord {
  readonly attempts: number;
  readonly consecutiveSuccesses: number;
  readonly handKey: string;
  readonly lastAttemptAt: number;
  readonly totalWrongLoss?: number;
  readonly wrong: number;
}

export interface PracticeAttempt {
  readonly at: number;
  readonly expectedPointsLoss?: number;
  readonly handKey: string;
  readonly isOptimal: boolean;
}

interface MaybePracticeRecord {
  readonly attempts?: unknown;
  readonly consecutiveSuccesses?: unknown;
  readonly handKey?: unknown;
  readonly lastAttemptAt?: unknown;
  readonly totalWrongLoss?: unknown;
  readonly wrong?: unknown;
}

export const isStoredPracticeRecord = (
  value: unknown,
): value is PracticeRecord => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as MaybePracticeRecord;
  const isTotalWrongLossValid =
    typeof candidate.totalWrongLoss === "undefined" ||
    (typeof candidate.totalWrongLoss === "number" &&
      !Number.isNaN(candidate.totalWrongLoss) &&
      candidate.totalWrongLoss >= 0);

  return (
    typeof candidate.handKey === "string" &&
    typeof candidate.attempts === "number" &&
    candidate.attempts > 0 &&
    typeof candidate.wrong === "number" &&
    candidate.wrong >= 0 &&
    typeof candidate.consecutiveSuccesses === "number" &&
    candidate.consecutiveSuccesses >= 0 &&
    typeof candidate.lastAttemptAt === "number" &&
    isTotalWrongLossValid &&
    parseHandKey(candidate.handKey) !== null
  );
};

export const updatePracticeRecords = (
  practice: readonly PracticeRecord[],
  attempt: PracticeAttempt,
  maxRecords: number,
): readonly PracticeRecord[] => {
  const existing = practice.find(
    (recordItem) => recordItem.handKey === attempt.handKey,
  );
  const loss = attempt.isOptimal ? 0 : (attempt.expectedPointsLoss ?? 0);
  const nextRecord: PracticeRecord = existing
    ? {
        attempts: existing.attempts + 1,
        consecutiveSuccesses: attempt.isOptimal
          ? existing.consecutiveSuccesses + 1
          : 0,
        handKey: attempt.handKey,
        lastAttemptAt: attempt.at,
        totalWrongLoss: (existing.totalWrongLoss ?? 0) + loss,
        wrong: existing.wrong + (attempt.isOptimal ? 0 : 1),
      }
    : {
        attempts: 1,
        consecutiveSuccesses: attempt.isOptimal ? 1 : 0,
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
