import { type Card, parseHand, serializeHand } from "../game/Card";
import { type JudgmentBasis, isJudgmentBasis } from "./recordedAdmission";
import { CARDS_PER_DISCARD } from "../game/facts";
import type { TableIdentity } from "../game/tableIdentity";
import { isFiniteNonNegative } from "./isFiniteNonNegative";
import { isObject } from "./isObject";
import { parseHandKey } from "./handKey";
import { resolveTableIdentity } from "./tableIdentityCodec";

export const MAX_ATTEMPT_LOG = 10_000;
export interface PracticeAttemptDetail {
  readonly basis: JudgmentBasis;
  readonly discardKey: string;
  readonly expectedPointsLoss: number;
  readonly isOptimal: boolean;
  readonly outcome: "success" | "failure";
  readonly tableIdentity: TableIdentity | null;
}
export interface PracticeAttemptEntry extends PracticeAttemptDetail {
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

export const isAttemptDetail = (
  value: unknown,
  handKey: string,
): value is PracticeAttemptDetail => {
  if (!isObject(value)) {
    return false;
  }
  const item = value as Partial<PracticeAttemptDetail>;
  return (
    typeof item.discardKey === "string" &&
    discardBelongsToHand(handKey, item.discardKey) &&
    isFiniteNonNegative(item.expectedPointsLoss) &&
    typeof item.isOptimal === "boolean" &&
    item.isOptimal === (item.expectedPointsLoss === 0) &&
    (item.outcome === "success" || item.outcome === "failure") &&
    isJudgmentBasis(item.basis) &&
    (item.isOptimal
      ? item.outcome === "success"
      : item.basis === "sampling-noise-v1" || item.outcome === "failure")
  );
};

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
        isAttemptDetail(item, handKey)
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
