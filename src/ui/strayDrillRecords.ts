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
 * two that are not cannot — so a single Set lookup answers "is this a
 * relabeling of something that was drilled" without building all 23
 * candidate keys for every ledger entry. The crib role rides along
 * untouched, so the same six cards under the other role never collide.
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
 * When #808 merged, and so the earliest instant any build could have written
 * a stray: before it, drilling a mistake dealt that mistake's own cards again
 * and `recordDiscardDecision`'s idempotency absorbed the re-attempt, so a
 * relabeled practice row written earlier came from something else.
 *
 * `at` is the wall clock of the browser that wrote the row, not release
 * provenance, and no release provenance was ever persisted to consult
 * instead — which is the whole difficulty of a migration written after the
 * fact. So read this as a filter that can only ever spare rows, never as
 * proof of era. It removes nothing that the conditions below would have
 * kept, and on any roughly correct clock it protects every pre-#808 row; on
 * a clock running far enough ahead of the cutoff a pre-#808 row loses that
 * protection and falls to the conditions below like any other. An earlier
 * version of this comment claimed no clock error could cost a row, which is
 * false in exactly that direction — both reviewers of #814 caught it.
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
 * Drops the practice rows that #808's suit-permuted drills left behind, and
 * nothing else it can rule out. Between #808 shipping and #809 landing, every
 * committed drill attempt keyed its decision record by the relabeled cards on
 * screen, so it escaped `recordDiscardDecision`'s idempotency and appended a
 * row naming six cards the player was never dealt. One row per distinct
 * relabeling rather than one per attempt: `suitPermutationForView` rules out
 * the identity and the previous view, not every earlier one, so a hand using
 * few suits exhausts its relabelings and later views land on a key already
 * recorded, which idempotency then absorbs. A single-suited hand has only
 * three. A code change cannot reach
 * back into `localStorage`, so those rows are swept here instead.
 *
 * The test is narrower than "matches no stored mistake", which was the shape
 * #809 proposed: a manually entered or seeded-session hand also records with
 * `isPractice: true` and has no ledger entry and no mistake-queue entry of its
 * own, because only the drill calls `recordPracticeAttempt`. Deleting those is
 * exactly what the over-broad fix reverted during #808's review took with
 * it, against `discardDecisionRecord`'s own contract that they are kept and
 * merely excluded from the headline averages.
 *
 * So a row is swept only when it meets every necessary condition of a stray
 * that survives in what was written: it was recorded no earlier than the
 * build that could first produce one, it is a suit relabeling of a hand that
 * was actually drilled, it is not that hand's own key, that relabeling moves
 * every suit the hand uses, and it was recorded before the hand's last drill.
 * Each is documented above where it is derived. None of them is sufficient on
 * its own, and even together they do not amount to proof. Any row recorded
 * since #808 shipped that satisfies all five is indistinguishable from a
 * stray, because nothing recorded at the time says which code path wrote it
 * and no amount of reading storage can recover that. Every source of an
 * `isPractice` row qualifies, not just hand entry: a seeded session's own
 * deals and a deep-linked hand are recorded the same way and have no ledger
 * entry either, so they sit in the ambiguous set on identical terms. Both
 * reviewers of #814 raised this, and it is why the conditions are stacked
 * rather than reduced to the cheapest one: each shrinks that set without
 * ever costing a row the remaining conditions would have kept.
 *
 * Idempotent by construction: one pass leaves nothing that a second could
 * match. Two kinds of stray are undetectable here and stay: one whose ledger
 * entry has since been evicted, and one whose ledger write never landed —
 * the decision row and the practice attempt are separate `localStorage`
 * writes, so a quota failure between them persists the row without the entry
 * that identifies it. Both err toward keeping an invisible row, which is the
 * direction to err in.
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
