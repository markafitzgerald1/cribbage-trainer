import { type Card, parseHand, serializeHand } from "../game/Card";
import { type JudgmentBasis, isJudgmentBasis } from "./recordedAdmission";
import { CARDS_PER_DISCARD } from "../game/facts";
import type { TableIdentity } from "../game/tableIdentity";
import { isFiniteNonNegative } from "./isFiniteNonNegative";
import { isObject } from "./isObject";
import { parseHandKey } from "./handKey";
import { resolveTableIdentity } from "./tableIdentityCodec";

// Full-cap stress storage in Chromium measures 5,147,904 bytes with 1,000
// Retries, reloads exactly, and leaves 94,955 ASCII characters of headroom.
// A 2,000-retry fixture exceeds quota; decision/aggregate compaction is separate.
// Aggregates remain the mastery authority when individual retries age out.
export const MAX_ATTEMPT_LOG = 1_000;
export interface PracticeAttemptDetail {
  // What graded this retry, not a queue admission: "exact-v1" when exact loss alone graded it (even where a decision's admission would read "exact-fallback-v1"), "sampling-noise-v1" when the live noise verdict made a positive loss a success.
  readonly basis: JudgmentBasis;
  readonly discardKey: string;
  readonly expectedPointsLoss: number;
  readonly isOptimal: boolean;
  readonly outcome: "success" | "failure";
  readonly tableIdentity: TableIdentity | null;
}
/*
 * A logged attempt as storage holds it. Its basis may be a later build's,
 * which this build carries verbatim rather than dropping the row; nothing
 * reads a logged basis, so no verdict depends on interpreting it.
 */
interface StoredAttemptDetail extends Omit<PracticeAttemptDetail, "basis"> {
  readonly basis: string;
}
export interface PracticeAttemptEntry extends StoredAttemptDetail {
  readonly at: number;
  readonly handKey: string;
  readonly order: number;
}

const discardBelongsToHand = (handKey: string, discardKey: string): boolean => {
  const parsed = parseHandKey(handKey);
  if (parsed === null) {
    return false;
  }
  try {
    const cards: Card[] = parseHand(discardKey);
    const hand = new Set(parsed.cards.map((card) => serializeHand([card])));
    return (
      cards.length === CARDS_PER_DISCARD &&
      new Set(cards.map((card) => serializeHand([card]))).size ===
        CARDS_PER_DISCARD &&
      cards.every((card) => hand.has(serializeHand([card])))
    );
  } catch {
    return false;
  }
};

// Only this build's exact bases forbid a positive-loss success; a basis it cannot read is not second-guessed.
const EXACT_BASES: readonly string[] = ["exact-v1", "exact-fallback-v1"];

const isStoredAttemptDetail = (
  value: unknown,
  handKey: string,
): value is StoredAttemptDetail => {
  if (!isObject(value)) {
    return false;
  }
  const item = value as Partial<StoredAttemptDetail>;
  return (
    typeof item.discardKey === "string" &&
    discardBelongsToHand(handKey, item.discardKey) &&
    isFiniteNonNegative(item.expectedPointsLoss) &&
    typeof item.isOptimal === "boolean" &&
    item.isOptimal === (item.expectedPointsLoss === 0) &&
    (item.outcome === "success" || item.outcome === "failure") &&
    typeof item.basis === "string" &&
    (item.isOptimal
      ? item.outcome === "success"
      : !EXACT_BASES.includes(item.basis) || item.outcome === "failure")
  );
};

// A new attempt is this build's own judgment, so its basis must be one this build defines.
export const isAttemptDetail = (
  value: unknown,
  handKey: string,
): value is PracticeAttemptDetail =>
  isStoredAttemptDetail(value, handKey) && isJudgmentBasis(value.basis);

const STORED_ATTEMPT_FIELDS = 9;

const decodeAttempt = (value: unknown): unknown => {
  if (!Array.isArray(value) || value.length !== STORED_ATTEMPT_FIELDS)
    return value;
  const [
    handKey,
    discardKey,
    at,
    order,
    tableIdentity,
    expectedPointsLoss,
    isOptimal,
    outcome,
    basis,
  ] = value as readonly unknown[];
  return {
    at,
    basis,
    discardKey,
    expectedPointsLoss,
    handKey,
    isOptimal,
    order,
    outcome,
    tableIdentity,
  };
};

export const normalizeAttemptLog = (
  entries: readonly unknown[],
  identities: readonly unknown[],
): readonly PracticeAttemptEntry[] => {
  const log: PracticeAttemptEntry[] = [];
  for (const stored of entries) {
    const value = decodeAttempt(stored);
    if (isObject(value)) {
      const item = value as Partial<PracticeAttemptEntry>;
      const { at, handKey, order } = item;
      if (
        typeof handKey === "string" &&
        isFiniteNonNegative(at) &&
        Number.isSafeInteger(order) &&
        isFiniteNonNegative(order) &&
        order > (log[log.length - 1]?.order ?? 0) &&
        isStoredAttemptDetail(item, handKey)
      ) {
        log.push({
          ...item,
          at,
          handKey,
          order,
          tableIdentity: resolveTableIdentity(item.tableIdentity, identities),
        });
      }
    }
  }
  return log.slice(-MAX_ATTEMPT_LOG);
};
