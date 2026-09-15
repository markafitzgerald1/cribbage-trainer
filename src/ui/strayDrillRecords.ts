import { SUITS, type Suit } from "../game/Card";
import { parseHandKey, toHandKey } from "./handKey";
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
 * A key this build cannot parse is its own signature. Only a decision record
 * can carry one — `isStoredPracticeRecord` rejects a ledger entry whose key
 * does not parse — so such a key is never in the drilled set, and the
 * exact-key check below already spares a record that matches itself.
 */
const relabelingSignature = (handKey: string): string => {
  const parsed = parseHandKey(handKey);
  if (parsed === null) {
    return handKey;
  }
  const renamed = new Map<Suit, Suit>();
  const canonicalCards = parsed.cards.map((card) => {
    const suit = renamed.get(card.suit) ?? suitAt(renamed.size);
    renamed.set(card.suit, suit);
    return { ...card, suit };
  });
  return toHandKey(canonicalCards, parsed.cribRole);
};

/*
 * Drops the practice rows that #808's suit-permuted drills left behind, and
 * nothing else. Between #808 shipping and #809 landing, every committed drill
 * attempt keyed its decision record by the relabeled cards on screen, so it
 * escaped `recordDiscardDecision`'s idempotency and appended a row naming six
 * cards the player was never dealt. A code change cannot reach back into
 * `localStorage`, so those rows are swept here instead.
 *
 * The test is narrower than "matches no stored mistake", which was the shape
 * #809 proposed: a manually entered or seeded-session hand also records with
 * `isPractice: true` and has no ledger entry and no mistake-queue entry of its
 * own, because only the drill calls `recordPracticeAttempt`. Deleting those is
 * exactly what the over-broad fix reverted during #808's review took with
 * it, against `discardDecisionRecord`'s own contract that they are kept and
 * merely excluded from the headline averages. So a row is a stray only when
 * it is a relabeling of a hand that was actually drilled — which every real
 * stray is, since the commit that wrote it recorded a practice attempt under
 * the canonical key in the same breath — and never when it carries that
 * hand's own key.
 *
 * Idempotent by construction: one pass leaves nothing that a second could
 * match. A stray whose ledger entry has since been evicted is undetectable
 * and stays; widening the test far enough to catch it would start taking
 * legitimate rows with it.
 */
export const withoutStrayDrillRecords = (
  records: readonly DiscardDecisionRecord[],
  practice: readonly PracticeRecord[],
): readonly DiscardDecisionRecord[] => {
  const drilledKeys = new Set(practice.map((record) => record.handKey));
  const drilledSignatures = new Set([...drilledKeys].map(relabelingSignature));
  return records.filter(
    (record) =>
      !record.isPractice ||
      drilledKeys.has(record.handKey) ||
      !drilledSignatures.has(relabelingSignature(record.handKey)),
  );
};
