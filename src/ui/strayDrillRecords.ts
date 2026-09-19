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
 * When #808 merged: a conservative bound on the production era, not on the
 * code. Before the merge, production drilled a mistake by dealing that
 * mistake's own cards again and `recordDiscardDecision`'s idempotency
 * absorbed the re-attempt — but PR previews and local checkouts ran the
 * offending code earlier, and #809's own reproduction came from a live #808
 * preview, so strays dated before this do exist. They are spared, which is
 * the safe direction; what this cannot claim is to be the earliest instant
 * any build could write one.
 *
 * This is a conservative filter, NOT a necessary condition of a stray, and
 * not proof of era. Two separate reasons, both raised in review after
 * earlier drafts of this comment claimed more than the data supports:
 *
 * A stray written by a browser clock running behind the cutoff fails this
 * check and is kept, so not every stray satisfies it — which is what a
 * necessary condition would mean. And a row written after the cutoff is not
 * thereby post-#808: the production deploy follows the merge, and a tab
 * holding the old bundle goes on writing with the old code indefinitely
 * after both, so a legitimate row can carry a later `at` on a perfectly
 * correct clock. No timestamp can separate those, because `at` is the
 * writing browser's wall clock and no release provenance was ever persisted
 * to consult instead — the whole difficulty of a migration written after the
 * fact.
 *
 * What it does buy, and the only claim made for it: relative to the
 * necessary conditions below, it can only ever spare rows. It never causes a
 * deletion those conditions would not already have made, and on a roughly
 * correct clock it spares the great majority of genuinely older rows.
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
 * that survives in what was written — it is a suit relabeling of a hand that
 * was actually drilled, it is not that hand's own key, that relabeling moves
 * every suit the hand uses, and it was recorded before the hand's last drill
 * — and additionally clears the release cutoff above, which is a
 * conservative filter rather than a fifth necessary condition and is
 * documented as such where it is defined. Each is derived where it is
 * declared. None of them is sufficient on
 * its own, and even together they do not amount to proof. Any row that
 * satisfies all of them is indistinguishable from a stray, because nothing
 * recorded at the time says which code path wrote it and no amount of
 * reading storage can recover that. Every source of an
 * `isPractice` row qualifies, not just hand entry: a seeded session's own
 * deals and a deep-linked hand are recorded the same way and have no ledger
 * entry either, so they sit in the ambiguous set on identical terms. Both
 * reviewers of #814 raised this, and it is why the conditions are stacked
 * rather than reduced to the cheapest one: each shrinks that set without
 * ever costing a row the remaining conditions would have kept.
 *
 * Idempotent by construction: one pass leaves nothing that a second could
 * match.
 *
 * **A stray survives whenever any one of the conditions fails for it**, and
 * that statement rather than a list is the complete account — the third
 * count this comment tried to give was contradicted by the cutoff's own
 * paragraph above, which is the failure mode this module is otherwise about.
 * To enumerate the cases, read the conditions and negate each in turn rather
 * than trusting a tally here. Two are worth knowing because neither is
 * visible from the conditions themselves: the decision row and the practice
 * attempt are separate `localStorage` writes, so a quota failure between
 * them persists a row whose identifying ledger entry never landed; and a
 * relabeled key can collide exactly with some OTHER drilled hand's key,
 * which the exact-key exemption then spares, needing that hand's own
 * decision record to have been evicted while its ledger entry survived,
 * since otherwise idempotency would have absorbed the colliding row rather
 * than appending it. That exemption is not worth narrowing to catch it,
 * because narrowing it is what would start deleting the original-key rows
 * this whole module exists to protect.
 *
 * Every one of them errs toward keeping a row, which is the safer direction
 * but is not a harmless one. A retained row occupies a slot under
 * `MAX_RECORDS`, so it can evict authentic history on a later write, and
 * `computeDiscardQualityTrend` derives `isAtRecordCap` from
 * `tally.records.length` without excluding practice rows, which the trend
 * dialog then shows. Worse, and the reason keeping a row is not free:
 * `recordDiscardDecision` matches its idempotency key on `handKey` alone,
 * with no `isPractice` qualification, so a retained row claims that key. If
 * those six cards are ever dealt authentically in that same order under that
 * same role, the real decision is skipped along with its lifetime
 * contribution, silently. An exactly ordered six-card collision from a real
 * deal is somewhere around one in 10^10, so this is a correctness statement
 * rather than a practical hazard — but it is the true cost of a retained
 * row, and hidden from the averages, the chart points and the mistake queue
 * is not the same as hidden.
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
