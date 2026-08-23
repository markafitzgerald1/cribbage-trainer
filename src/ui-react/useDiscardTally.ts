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
 * cannot make one hand look like two.
 */
const toHandKey = (dealtCards: readonly DealtCard[]): string =>
  serializeHand(dealtCards);

export const useDiscardTally = ({
  dealtCards,
  isSeededSession,
  wasDeepLinked,
}: UseDiscardTallyProps): DiscardTally => {
  const [summary, setSummary] = useState<DiscardTallySummary>(readDiscardTally);
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
      notePractice(toHandKey(cards), cause === "manual" || isSeededSession);
    },
    [isSeededSession, notePractice],
  );

  const reportAnalysisRendered = useCallback(
    ({ cribRole, quality }: RenderedAnalysis) => {
      if (quality === null) {
        return;
      }
      const handKey = toHandKey(dealtCards);
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
          isPractice: practiceByHand.current.get(handKey) ?? true,
        }),
      );
    },
    [dealtCards],
  );

  return { reportAnalysisRendered, reportHandOrigin, summary };
};
