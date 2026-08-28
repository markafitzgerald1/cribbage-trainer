import { CARDS_PER_DISCARD } from "../game/facts";
import { CribRole } from "../game/expectedCribPoints";
import { isFiniteNonNegative } from "./isFiniteNonNegative";
import { isObject } from "./isObject";
import { parseHand } from "../game/Card";

export interface DiscardDecisionRecord {
  readonly at: number;
  readonly cribRole: CribRole;
  // Serialized in deal order; null on records from versions before 3.
  readonly discardKey: string | null;
  // Cards and role; collapses re-renders from Back/Forward/sorts/reloads.
  readonly handKey: string;
  readonly expectedPointsLoss: number;
  readonly isOptimal: boolean;
  // Seeded, deep-linked, and manually entered hands are kept but excluded from headline averages.
  readonly isPractice: boolean;
  // Monotonic recording order for queue recency; `at` remains the calendar event time.
  readonly recencyAt?: number;
}

/*
 * Parsed storage is described by an interface with unknown-typed optional
 * fields rather than an index signature. An index signature would force
 * bracket access under noPropertyAccessFromIndexSignature, and eslint's
 * dot-notation rule rewrites exactly that back to dots on --fix, so the two
 * gates disagree forever. Declaring the fields settles it in the type.
 */
interface MaybeDecisionRecord {
  readonly at?: unknown;
  readonly cribRole?: unknown;
  readonly discardKey?: unknown;
  readonly handKey?: unknown;
  readonly expectedPointsLoss?: unknown;
  readonly isOptimal?: unknown;
  readonly isPractice?: unknown;
  readonly recencyAt?: unknown;
}

interface StoredDecisionRecord {
  readonly at: number;
  readonly cribRole: CribRole;
  readonly discardKey?: string | null;
  readonly expectedPointsLoss: number;
  readonly handKey: string;
  readonly isOptimal: boolean;
  readonly isPractice: boolean;
  readonly recencyAt?: number;
}

/*
 * Finite and non-negative, not just a JavaScript `number`: NaN and Infinity
 * both satisfy that bare type, and either one poisons every later record's
 * recencyAt once it reaches normalizeStoredRecords below, since Math.max
 * with a NaN argument returns NaN and each record's monotonic floor is
 * derived from the one before it.
 */
const isStoredDecisionRecord = (
  value: unknown,
): value is StoredDecisionRecord => {
  if (!isObject(value)) {
    return false;
  }
  const candidate = value as MaybeDecisionRecord;
  return (
    isFiniteNonNegative(candidate.at) &&
    typeof candidate.handKey === "string" &&
    isFiniteNonNegative(candidate.expectedPointsLoss) &&
    typeof candidate.isOptimal === "boolean" &&
    typeof candidate.isPractice === "boolean" &&
    (candidate.cribRole === CribRole.Dealer ||
      candidate.cribRole === CribRole.Pone) &&
    (typeof candidate.discardKey === "undefined" ||
      candidate.discardKey === null ||
      typeof candidate.discardKey === "string")
  );
};

const normalizeDiscardKey = (discardKey: unknown): string | null => {
  if (typeof discardKey !== "string") {
    return null;
  }
  try {
    return parseHand(discardKey).length === CARDS_PER_DISCARD
      ? discardKey
      : null;
  } catch {
    return null;
  }
};

const normalizeRecencyAt = (recencyAt: unknown, at: number): number =>
  typeof recencyAt === "number" && Number.isFinite(recencyAt) && recencyAt >= 0
    ? recencyAt
    : at;

/*
 * Legacy records carry no recencyAt and fall back to their own `at`, but
 * normalizing each independently let a clock rolled back between two
 * authentic decisions leave both with the same or an inverted value —
 * "Most recent" then ranked the earlier decision above the later one after
 * migration. The array's own insertion order is the missing signal: walking
 * it in order and forcing each recencyAt past the previous one derives a
 * monotonic history from records that never recorded one.
 */
export const normalizeStoredRecords = (
  records: readonly unknown[],
): readonly DiscardDecisionRecord[] => {
  const normalized: DiscardDecisionRecord[] = [];
  for (const record of records) {
    if (isStoredDecisionRecord(record)) {
      const previousRecencyAt =
        normalized[normalized.length - 1]?.recencyAt ?? record.at - 1;
      normalized.push({
        ...record,
        // Absent in a record written before version 3, or invalid, permanently null.
        discardKey: normalizeDiscardKey(record.discardKey),
        recencyAt: Math.max(
          normalizeRecencyAt(record.recencyAt, record.at),
          previousRecencyAt + 1,
        ),
      });
    }
  }
  return normalized;
};

export const latestDecisionRecencyAt = (
  records: readonly DiscardDecisionRecord[],
  fallback: number,
): number =>
  records.reduce(
    (latestAt, record) =>
      Math.max(latestAt, normalizeRecencyAt(record.recencyAt, record.at)),
    fallback,
  );
