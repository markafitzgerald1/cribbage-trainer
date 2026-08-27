import { parseHandKey } from "./handKey";

export interface PracticeRecord {
  readonly attempts: number;
  readonly consecutiveSuccesses: number;
  readonly handKey: string;
  readonly lastAttemptAt: number;
  readonly wrong: number;
}

export interface PracticeAttempt {
  readonly at: number;
  readonly handKey: string;
  readonly isOptimal: boolean;
}

interface MaybePracticeRecord {
  readonly attempts?: unknown;
  readonly consecutiveSuccesses?: unknown;
  readonly handKey?: unknown;
  readonly lastAttemptAt?: unknown;
  readonly wrong?: unknown;
}

export const isStoredPracticeRecord = (
  value: unknown,
): value is PracticeRecord => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as MaybePracticeRecord;
  return (
    typeof candidate.handKey === "string" &&
    typeof candidate.attempts === "number" &&
    candidate.attempts > 0 &&
    typeof candidate.wrong === "number" &&
    candidate.wrong >= 0 &&
    typeof candidate.consecutiveSuccesses === "number" &&
    candidate.consecutiveSuccesses >= 0 &&
    typeof candidate.lastAttemptAt === "number" &&
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
  const nextRecord: PracticeRecord = existing
    ? {
        attempts: existing.attempts + 1,
        consecutiveSuccesses: attempt.isOptimal
          ? existing.consecutiveSuccesses + 1
          : 0,
        handKey: attempt.handKey,
        lastAttemptAt: attempt.at,
        wrong: existing.wrong + (attempt.isOptimal ? 0 : 1),
      }
    : {
        attempts: 1,
        consecutiveSuccesses: attempt.isOptimal ? 1 : 0,
        handKey: attempt.handKey,
        lastAttemptAt: attempt.at,
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
