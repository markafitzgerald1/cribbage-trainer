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
import { useCallback, useRef, useState } from "react";
import type { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { serializeHand } from "../game/Card";

interface UseDiscardTallyProps {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];
  readonly isSeededSession: boolean;
  readonly wasDeepLinked: boolean;
}

// The hand a page load starts with is seeded at construction, so only replacements arrive here.
export type ReportHandOrigin = (
  cards: readonly DealtCard[],
  cause: HandReplacementCause,
  cribRole: CribRole,
) => void;

export interface DiscardTally {
  readonly reportAnalysisRendered: (analysis: RenderedAnalysis) => void;
  readonly reportHandOrigin: ReportHandOrigin;
  readonly summary: DiscardTallySummary;
}

/*
 * Deal order rather than the displayed order, so re-sorting the six cards
 * cannot make one hand look like two, and the crib role alongside them,
 * because the same six cards played as dealer and as pone are two different
 * decisions with two different best answers. Cards alone let a hand entered
 * to study the opposite role suppress the dealt hand's own decision.
 *
 * It is not a complete identity: the same cards entered by hand under the
 * same role still collide with the dealt hand. Closing that needs the
 * per-hand scope the telemetry hook keeps in history state, which is more
 * plumbing than the remaining case earns, so provenance can still be wrong
 * for it even though the decision is no longer lost.
 */
const toHandKey = (
  dealtCards: readonly DealtCard[],
  cribRole: CribRole,
): string => `${serializeHand(dealtCards)}|${cribRole}`;

export const useDiscardTally = ({
  cribRole,
  dealtCards,
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
  const openHand = useRef<{ key: string; scored: boolean } | null>(
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
      : { key: toHandKey(dealtCards, cribRole), scored: false },
  );

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

  const notePractice = useCallback((handKey: string, isPractice: boolean) => {
    practiceByHand.current.set(handKey, isPractice);
  }, []);

  const reportHandOrigin: ReportHandOrigin = useCallback(
    (cards, cause, role) => {
      /*
       * The hand being replaced is abandoned unless it was scored. Only a
       * hand the player asked for counts: the one a page load deals was
       * never chosen, and practice hands are already outside the averages,
       * so charging either as avoidance would describe neither correctly.
       */
      const abandoned = openHand.current;
      if (
        abandoned !== null &&
        !abandoned.scored &&
        practiceByHand.current.get(abandoned.key) === false
      ) {
        setSummary(recordSkippedHand(Date.now()));
      }
      const isPractice = cause === "manual" || isSeededSession;
      // A deal inside a seeded session is still study: the hand was chosen by the seed rather than met blind.
      notePractice(toHandKey(cards, role), isPractice);
      openHand.current = { key: toHandKey(cards, role), scored: false };
    },
    [isSeededSession, notePractice],
  );

  const reportAnalysisRendered = useCallback(
    ({ cribRole: scoredRole, quality }: RenderedAnalysis) => {
      if (quality === null) {
        return;
      }
      const handKey = toHandKey(dealtCards, scoredRole);
      if (openHand.current?.key === handKey) {
        openHand.current = { key: handKey, scored: true };
      }
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

  return { reportAnalysisRendered, reportHandOrigin, summary };
};
