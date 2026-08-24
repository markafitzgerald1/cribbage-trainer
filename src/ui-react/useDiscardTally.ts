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
import { useCallback, useEffect, useRef, useState } from "react";
import type { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { discardIsComplete } from "../game/discardIsComplete";
import { serializeHand } from "../game/Card";

interface UseDiscardTallyProps {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];
  // Telemetry's own identifier for the hand this page load starts with, needed only to give that hand a true identity for later restores to compare against.
  readonly initialHandId: string;
  readonly isSeededSession: boolean;
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
  readonly reportAnalysisRendered: (analysis: RenderedAnalysis) => void;
  readonly reportHandOrigin: ReportHandOrigin;
  readonly reportHandRestored: ReportHandRestored;
  readonly summary: DiscardTallySummary;
}

/*
 * Deal order rather than the displayed order, so re-sorting the six cards
 * cannot make one hand look like two, and the crib role alongside them,
 * because the same six cards played as dealer and as pone are two different
 * decisions with two different best answers. Cards alone let a hand entered
 * to study the opposite role suppress the dealt hand's own decision.
 *
 * Not a complete identity by itself: the same cards entered by hand can
 * later coincide with a genuinely dealt hand under the same role, and only
 * one of the two occurrences is practice. What tells them apart is
 * telemetry's own per-hand scope, tracked alongside this key as the open
 * hand's identity (see `OpenHand` below) — the key alone is what a stored
 * record is keyed by and what provenance is looked up by, but which
 * occurrence a history restore names is decided by scope, not by key.
 */
const toHandKey = (
  dealtCards: readonly DealtCard[],
  cribRole: CribRole,
): string => `${serializeHand(dealtCards)}|${cribRole}`;

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

export const useDiscardTally = ({
  cribRole,
  dealtCards,
  initialHandId,
  isSeededSession,
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
      : { handId: initialHandId, key: toHandKey(dealtCards, cribRole) },
  );

  /*
   * Hands that have completed a discard at some point, which is not the same
   * as hands showing one now. Deselecting a card after deciding, or stepping
   * Back to the same hand before its discard, leaves the cards incomplete
   * while the decision is already counted — and reading the cards alone then
   * charged that hand a skip as well, putting one hand in both columns and
   * inflating the denominator they share.
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
    if (discardIsComplete(dealtCards)) {
      decidedHands.current.add(toHandKey(dealtCards, cribRole));
    }
  }, [cribRole, dealtCards]);

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
        !decidedHands.current.has(abandoned.key) &&
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
    ({ cribRole: scoredRole, quality }: RenderedAnalysis) => {
      if (quality === null) {
        return;
      }
      const handKey = toHandKey(dealtCards, scoredRole);
      setSummary(
        recordDiscardDecision({
          at: Date.now(),
          cribRole: scoredRole,
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
           * Looked up by the same key the record carries. Keying provenance on
           * cards alone let a hand re-entered under the opposite role mark the
           * dealt hand as practice, so its authentic decision was recorded and
           * then left out of every figure shown.
           *
           * An unknown hand counts as practice: it can only be one this
           * session never dealt.
           */
          isPractice: practiceByHand.current.get(handKey) ?? true,
        }),
      );
    },
    [dealtCards],
  );

  return {
    reportAnalysisRendered,
    reportHandOrigin,
    reportHandRestored,
    summary,
  };
};
