import {
  type DiscardTallySummary,
  readDiscardTally,
  recordDiscardDecision,
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
  readonly dealtCards: readonly DealtCard[];
  readonly isSeededSession: boolean;
  readonly wasDeepLinked: boolean;
}

export interface DiscardTally {
  readonly reportAnalysisRendered: (analysis: RenderedAnalysis) => void;
  // The hand a page load starts with is seeded at construction, so only replacements arrive here.
  readonly reportHandOrigin: (
    cards: readonly DealtCard[],
    cause: HandReplacementCause,
  ) => void;
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
  const practiceByHand = useRef(
    /*
     * Seeded eagerly with the hand this page load starts with, rather than in
     * a mount effect: the first score can arrive before passive effects run,
     * and a hand missing from this map is read as practice, so a late seed
     * would mislabel exactly the decision it was meant to describe.
     */
    new Map<string, boolean>([
      [serializeHand(dealtCards), isSeededSession || wasDeepLinked],
    ]),
  );

  const notePractice = useCallback((handKey: string, isPractice: boolean) => {
    practiceByHand.current.set(handKey, isPractice);
  }, []);

  const reportHandOrigin = useCallback(
    (cards: readonly DealtCard[], cause: HandReplacementCause) => {
      // A deal inside a seeded session is still study: the hand was chosen by the seed rather than met blind.
      notePractice(serializeHand(cards), cause === "manual" || isSeededSession);
    },
    [isSeededSession, notePractice],
  );

  const reportAnalysisRendered = useCallback(
    ({ cribRole, quality }: RenderedAnalysis) => {
      if (quality === null) {
        return;
      }
      const handKey = toHandKey(dealtCards, cribRole);
      setSummary(
        recordDiscardDecision({
          at: Date.now(),
          cribRole,
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
           * Looked up by cards alone, because a replacement announces itself
           * before its role reaches this hook. An unknown hand is treated as
           * practice: it can only be one this session never dealt.
           */
          isPractice:
            practiceByHand.current.get(serializeHand(dealtCards)) ?? true,
        }),
      );
    },
    [dealtCards],
  );

  return { reportAnalysisRendered, reportHandOrigin, summary };
};
