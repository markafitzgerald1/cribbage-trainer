import { useCallback, useRef, useState } from "react";
import type { HandReplacementCause } from "./useDiscardTelemetry";

// Why the hand on screen is left out of the tally; null when it counts. A history restore says nothing about where a hand came from, so it has no reason of its own.
export type UncountedReason = "entered" | "linked" | "seeded";

export const initialUncountedReason = (
  isSeededSession: boolean,
  isPracticeInitialHand: boolean,
): UncountedReason | null => {
  if (isSeededSession) {
    return "seeded";
  }
  return isPracticeInitialHand ? "linked" : null;
};

export const replacementReason = (
  cause: HandReplacementCause,
  isSeededSession: boolean,
): UncountedReason | null => {
  if (cause === "manual") {
    return "entered";
  }
  return isSeededSession ? "seeded" : null;
};

/*
 * Held per hand like the tally's own provenance, so Back returns to the
 * reason a hand was filed with. State rather than a ref because the note
 * reads it during render.
 */
export const useUncountedReason = (
  initialKey: string,
  initialReason: UncountedReason | null,
) => {
  const [uncountedReason, setUncountedReason] = useState(initialReason);
  const reasonByHand = useRef(
    new Map<string, UncountedReason | null>([[initialKey, initialReason]]),
  );
  const noteReason = useCallback(
    (handKey: string | null, reason: UncountedReason | null) => {
      if (handKey !== null) {
        reasonByHand.current.set(handKey, reason);
      }
      setUncountedReason(reason);
    },
    [],
  );
  const reasonFor = useCallback(
    (handKey: string): UncountedReason | null =>
      reasonByHand.current.get(handKey) ?? null,
    [],
  );
  return { noteReason, reasonFor, uncountedReason };
};
