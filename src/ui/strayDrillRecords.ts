import { type Card, SUITS, type Suit } from "../game/Card";
import { type ParsedHandKey, parseHandKey, toHandKey } from "./handKey";
import type { DiscardDecisionRecord } from "./discardDecisionRecord";
import type { PracticeRecord } from "./practiceLedger";

/*
 * Named rather than asserted inline, because the index below is always how
 * many distinct suits have been seen so far, which a hand drawn from a
 * four-suited deck cannot push past three. Stated as its own function so the
 * cast is required by the return type instead of sitting in a `??` position
 * that reads as redundant (see `itemAt` in mistakeQueue.ts for the idiom).
 */
const suitAt = (index: number): Suit => SUITS.at(index) as Suit;

/*
 * A hand key with its suits renamed in order of first appearance. A global
 * suit renaming is the only thing a practice drill ever does to a stored
 * mistake, and two keys related by one reduce to the same signature while
 * two that are not cannot — so keying a Map by signature answers "is this a
 * relabeling of something that was drilled" without building all 23
 * candidate keys for every ledger entry. Answering it still costs parsing
 * and canonicalizing the row, the Map lookup, and a scan of the matching
 * bucket; only the exact-key exemption below is a bare Set lookup. The crib
 * role rides along untouched, so the same six cards under the other role
 * never collide.
 *
 * Takes a parsed hand rather than a key, so there is no unreachable branch
 * here for a key that does not parse: both callers below have already parsed
 * theirs and dropped it if they could not.
 */
const relabelingSignature = ({ cards, cribRole }: ParsedHandKey): string => {
  const renamed = new Map<Suit, Suit>();
  const canonicalCards = cards.map((card) => {
    const suit = renamed.get(card.suit) ?? suitAt(renamed.size);
    renamed.set(card.suit, suit);
    return { ...card, suit };
  });
  return toHandKey(canonicalCards, cribRole);
};

/*
 * Both hands here were parsed from a hand key, which admits exactly
 * CARDS_PER_DEALT_HAND cards, and only hands whose signatures already match
 * are compared — so the index is always in range and the cast states that
 * rather than papering over a real chance of undefined.
 */
const suitOf = (cards: readonly Card[], index: number): Suit =>
  (cards.at(index) as Card).suit;

/*
 * `suitPermutationForView` guarantees that view 0 moves EVERY suit the stored
 * hand uses, and checks every later view against the stored hand too, so no
 * view ever leaves one of the hand's suits where it found it. A relabeling
 * that fixes even one used suit is therefore something no drill produced.
 *
 * Positional comparison is enough because the two hands already share a
 * relabeling signature, which makes the suit map between them a consistent
 * bijection: a suit stays put for one card exactly when it stays put for all
 * of them.
 */
const movesEveryUsedSuit = (
  drilledCards: readonly Card[],
  shownCards: readonly Card[],
): boolean =>
  drilledCards.every((card, index) => card.suit !== suitOf(shownCards, index));

/*
 * A stray was written by `recordDiscardDecision` and the practice attempt for
 * the same commit by `recordPracticeAttempt` immediately after it, and the
 * second forces its `lastAttemptAt` past every decision recency it can see —
 * including the one just written. So a stray's recency is always strictly
 * below its ledger entry's `lastAttemptAt`, and that entry only ever moves
 * later. A practice row recorded after a hand's last drill is therefore
 * provably not a stray of it.
 */
const recencyOf = (record: DiscardDecisionRecord): number =>
  record.recencyAt ?? record.at;

/*
 * When #808 merged, used as a filter and not as a necessary condition of a
 * stray: previews and local checkouts ran the offending code before the
 * merge, `at` is the writing browser's wall clock rather than release
 * provenance, and no provenance was ever persisted to consult instead. So it
 * proves nothing about era. What it buys is one-directional — relative to
 * the conditions below it can only spare rows, never cause a deletion they
 * would not already have made. #814 has the argument.
 */
export const DRILL_RELABELING_SHIPPED_AT = Date.parse("2026-09-15T04:01:53Z");

interface DrilledHand {
  readonly cards: readonly Card[];
  readonly lastAttemptAt: number;
}

const drilledHandsBySignature = (
  practice: readonly PracticeRecord[],
): Map<string, DrilledHand[]> => {
  const bySignature = new Map<string, DrilledHand[]>();
  for (const entry of practice) {
    const parsed = parseHandKey(entry.handKey);
    if (parsed !== null) {
      const signature = relabelingSignature(parsed);
      const drilled = bySignature.get(signature) ?? [];
      drilled.push({
        cards: parsed.cards,
        lastAttemptAt: entry.lastAttemptAt,
      });
      bySignature.set(signature, drilled);
    }
  }
  return bySignature;
};

/*
 * Drops the rows #808's suit-permuted drills left behind: each committed
 * attempt keyed its record by the relabeled cards on screen, escaping
 * `recordDiscardDecision`'s idempotency, and a code change cannot reach back
 * into `localStorage`.
 *
 * Every condition below is a necessary condition of a stray, derived where
 * it is declared, and the release cutoff above is a filter on top. The
 * obvious test — a practice row matching no stored mistake — is not one of
 * them and must not become one: manually entered, seeded and deep-linked
 * hands all record as practice with no ledger entry, and deleting them is
 * what the over-broad fix reverted during #808's review did.
 *
 * None of the conditions is sufficient even together, so a row satisfying
 * all of them is indistinguishable from a stray; stacking them shrinks that
 * ambiguity without ever costing a row the rest would have kept. A stray
 * survives whenever any one fails, which is the whole account — negate the
 * conditions rather than trusting a list, since three attempts at listing
 * the cases here were each contradicted by another paragraph.
 *
 * Idempotent: one pass leaves nothing a second could match. Retaining a row
 * is the safe direction but not a free one — it holds a slot under
 * `MAX_RECORDS`, feeds `isAtRecordCap`, and owns its `handKey` against a
 * later authentic deal of those cards (#830).
 */
export const withoutStrayDrillRecords = (
  records: readonly DiscardDecisionRecord[],
  practice: readonly PracticeRecord[],
): readonly DiscardDecisionRecord[] => {
  const drilledKeys = new Set(practice.map((record) => record.handKey));
  const bySignature = drilledHandsBySignature(practice);
  const isStray = (record: DiscardDecisionRecord): boolean => {
    const parsed = parseHandKey(record.handKey);
    if (parsed === null) {
      return false;
    }
    if (record.at < DRILL_RELABELING_SHIPPED_AT) {
      return false;
    }
    const candidates = bySignature.get(relabelingSignature(parsed));
    return (candidates ?? []).some(
      (drilled) =>
        recencyOf(record) < drilled.lastAttemptAt &&
        movesEveryUsedSuit(drilled.cards, parsed.cards),
    );
  };
  return records.filter(
    (record) =>
      !record.isPractice || drilledKeys.has(record.handKey) || !isStray(record),
  );
};
