/* jscpd:ignore-start */
import {
  type DiscardTallySummary,
  readDiscardTally,
  recordDiscardDecision,
  recordSkippedHand,
} from "../ui/discardTally";
import type {
  HandReplacementCause,
  RenderedAnalysis,
} from "./useDiscardTelemetry";
import { type Suit, serializeHand } from "../game/Card";
import {
  invertSuitPermutation,
  permuteCardSuits,
} from "../game/suitPermutation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { SortOrder } from "../ui/SortOrder";
import { discardIsComplete } from "../game/discardIsComplete";
import { sortUrlValue } from "../ui/urlAnalysisState";
import { toHandKey } from "../ui/handKey";
/* jscpd:ignore-end */

/*
 * What the board is showing, when it is not showing its own cards: the
 * global suit renaming a practice drill applied to a stored hand to put a
 * relabeled stand-in for it on screen. Callers that are showing the cards
 * they mean pass null, which is every path but a drill.
 *
 * A renaming rather than a canonical key, because the discard is just as
 * relabeled as the hand: undoing one relabeling recovers both, so a record
 * written from it names a discard that is actually in the hand it names.
 * Cribbage has no trump and suits reach scoring only through flushes and his
 * nobs, both preserved under a global renaming, so nothing derived from the
 * recovered cards differs from what the stored hand would have derived.
 */
export type DisplayedHandRelabeling = readonly Suit[];

interface UseDiscardTallyProps {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];
  /*
   * Telemetry's identifier for the hand on screen now, read on every render.
   * It is the only hand identity there is: Trainer stamps it onto every
   * history entry it writes, so anything here that tracked an identity of its
   * own would drift from the one a later restore hands back (#874).
   */
  readonly handId: string;
  readonly isSeededSession: boolean;
  // The sort order on screen right now, captured the instant a discard is completed or restored (see `capture` below).
  readonly sortOrder: SortOrder;
  readonly wasDeepLinked: boolean;
}

/*
 * Which hand a set of cards is, carried as one unit the way telemetry's
 * own `HistoryHandScope` does. The role decides what the best discard even
 * is, and the handId is telemetry's per-hand identifier, which is what
 * separates two occurrences of identical cards under identical roles.
 */
interface HandIdentity {
  readonly cribRole: CribRole;
  readonly handId: string;
}

/*
 * The same, as a history entry states it. Either half may be absent: an
 * entry written before this document loaded carries no scope, and a URL this
 * build cannot parse a role from yields none — both of which are read as
 * "cannot vouch for this hand" rather than guessed at.
 */
interface RestoredHandIdentity {
  readonly cribRole: CribRole | null;
  readonly handId: string | null;
}

// The hand a page load starts with is seeded at construction, so only replacements arrive here.
export type ReportHandOrigin = (
  cards: readonly DealtCard[],
  cause: HandReplacementCause,
  identity: HandIdentity,
) => void;

export type ReportHandRestored = (
  cards: readonly DealtCard[],
  entry: RestoredHandIdentity,
) => void;

export interface DiscardTally {
  readonly reportAnalysisRendered: (
    analysis: RenderedAnalysis,
    displayedAs: DisplayedHandRelabeling | null,
  ) => void;
  readonly reportHandOrigin: ReportHandOrigin;
  readonly reportHandRestored: ReportHandRestored;
  readonly summary: DiscardTallySummary;
}

/*
 * The hand currently on screen: its record key, and telemetry's own
 * identifier for it. Two different occurrences of the same cards and role —
 * a hand entered to study and a later genuine deal of it — share one key but
 * never one handId, which is what lets a history restore tell them apart.
 */
interface OpenHand {
  readonly handId: string | null;
  readonly key: string;
}

/*
 * A discard's identity: the hand and role it belongs to, plus which cards
 * were not kept. Module-level and pure — it closes over nothing from the
 * hook — so both the capture below and reportAnalysisRendered's later
 * lookup can share it without either reading the other's local variable,
 * and so a hand alone is never mistaken for one particular discard of it.
 */
interface SortOrderCapture {
  readonly key: string;
  readonly sortOrder: SortOrder;
}

const completionKeyFor = (
  cards: readonly DealtCard[],
  role: CribRole,
): string =>
  `${toHandKey(cards, role)}|${serializeHand(cards.filter((card) => !card.kept))}`;

export const useDiscardTally = ({
  cribRole,
  dealtCards,
  handId: boardHandId,
  isSeededSession,
  sortOrder,
  wasDeepLinked,
}: UseDiscardTallyProps): DiscardTally => {
  const [summary, setSummary] = useState<DiscardTallySummary>(() =>
    readDiscardTally(Date.now()),
  );
  /*
   * Provenance belongs to the hand, not to the moment a score arrives, and
   * the cards on screen never say where they came from. Holding it per hand
   * is also what makes history navigation exact: a hand returned to by Back
   * keeps the origin it was dealt with, rather than being reclassified by
   * whatever the app happens to be doing when it reappears.
   */
  /*
   * The hand currently on screen, and whether its decision has been counted.
   * Dealing away from a hand that never was is what a skip is, so the check
   * has to happen at the moment of replacement rather than later: once the
   * cards change there is nothing left to notice was abandoned.
   */
  const openHand = useRef<OpenHand | null>(
    /*
     * The hand a page load starts with is open like any other. Exempting it
     * looked fair — nobody chose it — but pressing Deal from it is a
     * deliberate abandonment, and leaving it uncounted made the first hand of
     * every session free to walk away from.
     *
     * Practice starts stay closed: a seeded or deep-linked hand is study, and
     * study is outside these figures entirely.
     *
     * One gap remains and cannot be closed from here: reloading the page
     * abandons the open hand without replacing it, so nothing observes the
     * departure. Catching that needs the open hand to outlive the session in
     * storage, which is more machinery than a loophole this visible earns.
     */
    isSeededSession || wasDeepLinked
      ? null
      : { handId: boardHandId, key: toHandKey(dealtCards, cribRole) },
  );

  /*
   * Hands that have completed a discard at some point, which is not the same
   * as hands showing one now. Deselecting a card after deciding, or stepping
   * Back to the same hand before its discard, leaves the cards incomplete
   * while the decision is already counted — and reading the cards alone then
   * charged that hand a skip as well, putting one hand in both columns and
   * inflating the denominator they share.
   *
   * Keyed by handId, not by the card-role key: the same cards under the same
   * role can be two different occurrences — a hand entered to study and a
   * later genuine deal of it — and a key match alone cannot tell one
   * occurrence's completion from the other's abandonment. Keying by the
   * card-role key let a practiced hand's completion mark a later,
   * coincidentally identical authentic deal as already decided, so
   * abandoning that deal recorded no skip at all. Falls back to the key only
   * when no handId is known, the same degraded identity this file already
   * accepts elsewhere.
   */
  const decidedHands = useRef(new Set<string>());

  const practiceByHand = useRef(
    /*
     * Seeded eagerly with the hand this page load starts with, rather than in
     * a mount effect: the first score can arrive before passive effects run,
     * and a hand missing from this map is read as practice, so a late seed
     * would mislabel exactly the decision it was meant to describe.
     */
    new Map<string, boolean>([
      [toHandKey(dealtCards, cribRole), isSeededSession || wasDeepLinked],
    ]),
  );

  /*
   * The sort order on screen when the discard now on the board arrived
   * there (#872): by the click that completed it, or by the history move
   * that restored it. A re-sort while it stays on screen never changes it.
   * Only the board on screen can be scored, so one capture is enough: it is
   * dropped whenever the board shows no complete discard, and it is keyed by
   * the hand occurrence as well as the discard, because the identical cards,
   * role and discard can come round again (Enter Cards, a seeded or
   * deep-linked first hand, Back to an earlier deal) and must never inherit
   * an earlier occurrence's order. Dropping it is deliberate even before a
   * score arrives: a board that stops showing the discard has withdrawn that
   * completion, so the next one is fresh and takes the order then on screen.
   *
   * A restore is always such an arrival, even when it changes nothing the
   * key holds: reportHandRestored drops the capture, so the render that
   * shows the restored board retakes it from the restored sort. Back between
   * two completions of the identical discard — withdrawn and redone under
   * another sort — is indistinguishable here from Back between two sorts of
   * one completion, and without an identity for history entries, which the
   * tally deliberately does not keep, the order the restore shows is the
   * only observed value that fits both.
   *
   * The occurrence is telemetry's handId itself, not a counter of this
   * hook's own. A counter advanced by this hook's reports was a second copy
   * of telemetry's decision about which hand is showing, and every way the
   * two could disagree re-captured a later sort order: a cross-hand restore
   * that telemetry answered with a fresh scope while this hook kept the
   * entry's old one, and a same-hand Back onto a seeded or deep-linked first
   * hand, which this hook never opened and so read as a different hand.
   *
   * Set during render (React's "adjust state while rendering" idiom, as
   * usePracticeDrill.ts uses) rather than in an effect: the child analysis
   * component's effects run before this parent's in the same commit, so an
   * effect could lose the race and leave the first score with no capture.
   */
  const [capture, setCapture] = useState<SortOrderCapture | null>(null);
  const boardCaptureKey = discardIsComplete(dealtCards)
    ? `${boardHandId}|${completionKeyFor(dealtCards, cribRole)}`
    : null;
  if ((capture?.key ?? null) !== boardCaptureKey) {
    setCapture(
      boardCaptureKey === null ? null : { key: boardCaptureKey, sortOrder },
    );
  }

  /*
   * Today is computed when a hand is recorded, so a tab left open across
   * local midnight goes on showing yesterday's play under "today" — a label
   * asserting something false, which is worse than a figure simply missing.
   * Returning to the tab recomputes it, which also picks up anything another
   * tab recorded while this one was hidden.
   *
   * A tab left visible across midnight still shows the old day until its
   * next interaction. Catching that needs a timer armed for the next
   * midnight, which is more machinery than a figure nobody is looking at.
   */
  /*
   * Watched rather than reported, because completion is a property of the
   * cards and nothing has to announce it: the score that follows may never
   * arrive if the expected-points tables are slow or fail, and a decision
   * does not stop being one for that.
   */
  useEffect(() => {
    if (discardIsComplete(dealtCards) && openHand.current !== null) {
      decidedHands.current.add(openHand.current.handId ?? openHand.current.key);
    }
  }, [dealtCards]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        setSummary(readDiscardTally(Date.now()));
      }
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const notePractice = useCallback((handKey: string, isPractice: boolean) => {
    practiceByHand.current.set(handKey, isPractice);
  }, []);

  const reportHandOrigin: ReportHandOrigin = useCallback(
    (cards, cause, { cribRole: role, handId }) => {
      /*
       * The hand being replaced is abandoned unless it was scored. Only a
       * hand the player asked for counts: the one a page load deals was
       * never chosen, and practice hands are already outside the averages,
       * so charging either as avoidance would describe neither correctly.
       */
      /*
       * Whether the discard was completed, not whether its score arrived.
       * Scoring waits on the expected-points tables, so a slow or failed load
       * would otherwise turn a decision the player did make into avoidance —
       * counting them as having ducked the hand they actually played.
       */
      const abandoned = openHand.current;
      if (
        abandoned !== null &&
        /*
         * Setting a hand aside to study it — a drill start, or a hand typed
         * into Enter cards — is not ducking it; only pressing Deal for a
         * fresh authentic hand is. Without this, every "Start drill" charged
         * the hand on the board a skip whether or not a discard was chosen.
         */
        cause !== "manual" &&
        !decidedHands.current.has(abandoned.handId ?? abandoned.key) &&
        practiceByHand.current.get(abandoned.key) === false
      ) {
        setSummary(recordSkippedHand(Date.now()));
      }
      const isPractice = cause === "manual" || isSeededSession;
      const key = toHandKey(cards, role);
      // A deal inside a seeded session is still study: the hand was chosen by the seed rather than met blind.
      notePractice(key, isPractice);
      openHand.current = { handId, key };
    },
    [isSeededSession, notePractice],
  );

  /*
   * A hand history navigation restores is never first instinct, matching the
   * population rule telemetry already applies (see the filtering contract in
   * skills/analytics-telemetry/SKILL.md): its ranked answers were already
   * revealed, either by whichever visit first completed it or by the answer
   * key a reload of its own URL shows immediately. Marking it here, rather
   * than only checking at score time, also stops a second walk-away from
   * charging a skip the first walk-away already recorded.
   *
   * Guarded on telemetry's own scope rather than the record key: the same
   * cards under the same role can name two different occurrences — a hand
   * entered to study and a later genuine deal of it — and a key match alone
   * cannot tell a restore of one from a restore of the other. A restore
   * naming no scope at all is never treated as the hand already open, which
   * is also what telemetry itself does with such an entry. A restore that
   * does name the hand already open — a sort-only push, or Back to an
   * earlier state of the hand still on screen — leaves whatever provenance
   * it already had, or marking it here would wrongly overwrite an authentic
   * hand mid-decision.
   */
  const reportHandRestored: ReportHandRestored = useCallback(
    (cards, { cribRole: role, handId }) => {
      // Batched with the restored board and sort, so the next render retakes the capture from the order the restore shows (see `capture`).
      setCapture(null);
      if (role === null) {
        return;
      }
      if (handId === null || handId !== openHand.current?.handId) {
        const key = toHandKey(cards, role);
        practiceByHand.current.set(key, true);
        openHand.current = { handId, key };
      }
    },
    [],
  );

  const reportAnalysisRendered = useCallback(
    (
      {
        cribRole: scoredRole,
        oppositeRoleExpectedPointsLoss,
        quality,
      }: RenderedAnalysis,
      displayedAs: DisplayedHandRelabeling | null,
    ) => {
      if (quality === null) {
        return;
      }
      /*
       * Two keys, because a drill puts a relabeled stand-in on the board and
       * the two questions then have different answers. `boardKey` is the
       * hand on screen, which is what provenance was filed under when that
       * hand was loaded. `handKey` below is the hand the decision is
       * actually about, and a drill's is the stored mistake's own key — so
       * recordDiscardDecision's idempotency absorbs a re-attempt into the
       * record of the hand being practiced, instead of appending a row under
       * a key naming cards the player never met — one per distinct
       * relabeling, since a hand using few suits soon reuses a key that
       * idempotency then absorbs (#809).
       */
      const boardKey = toHandKey(dealtCards, scoredRole);
      const decidedCards =
        displayedAs === null
          ? dealtCards
          : permuteCardSuits(dealtCards, invertSuitPermutation(displayedAs));
      const handKey = toHandKey(decidedCards, scoredRole);
      const discardKey = serializeHand(
        decidedCards.filter((card) => !card.kept),
      );
      // Only a capture of this exact occurrence and discard describes the decision being scored.
      const capturedSortOrder =
        capture?.key ===
        `${boardHandId}|${completionKeyFor(dealtCards, scoredRole)}`
          ? capture.sortOrder
          : null;
      setSummary(
        recordDiscardDecision({
          at: Date.now(),
          cribRole: scoredRole,
          discardKey,
          expectedPointsLoss: quality.expectedPointsLoss,
          handKey,
          isOptimal: quality.isOptimal,
          /*
           * An unknown hand is treated as practice. It can only be one this
           * session never dealt — a history entry surviving a page load —
           * and counting it would add a decision whose origin nothing here
           * can vouch for.
           */
          /*
           * Looked up by the hand on screen, which is the key reportHandOrigin
           * filed this hand under — for a drill, the relabeled cards it loaded.
           * Keying provenance on cards alone let a hand re-entered under the
           * opposite role mark the dealt hand as practice, so its authentic
           * decision was recorded and then left out of every figure shown; the
           * role is still in this key, so that stays fixed.
           *
           * An unknown hand counts as practice: it can only be one this
           * session never dealt.
           */
          isPractice: practiceByHand.current.get(boardKey) ?? true,
          /*
           * Spread rather than assigned, so an unknown figure leaves the
           * key off the record entirely. Writing it as zero would be
           * indistinguishable from the discard having been exactly best
           * for the role the player did not hold, which is the single most
           * interesting value this field can take (#824).
           */
          ...(typeof oppositeRoleExpectedPointsLoss === "number"
            ? { oppositeRoleExpectedPointsLoss }
            : {}),
          /*
           * Explicit numeric-type check rather than a truthiness one:
           * SortOrder.DealOrder is 0, and `capturedSortOrder ? … : …` would
           * silently treat a deal-order decision the same as one this hook
           * never saw complete (#872).
           */
          ...(typeof capturedSortOrder === "number"
            ? { sortOrder: sortUrlValue(capturedSortOrder) }
            : {}),
        }),
      );
    },
    [boardHandId, capture, dealtCards],
  );

  return {
    reportAnalysisRendered,
    reportHandOrigin,
    reportHandRestored,
    summary,
  };
};
