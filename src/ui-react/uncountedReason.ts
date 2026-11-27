import {
  currentUnsavedBatch,
  isAuthenticDecisionRetained,
} from "../ui/discardTally";
import { useCallback, useState } from "react";
import type { HandReplacementCause } from "./useDiscardTelemetry";

// Which observed cause keeps the board's current selection out of the tally. The note travels with the tally's practice state or with post-count selection changes on a counted hand.
export type UncountedReason =
  | "decided"
  | "drill"
  | "entered"
  | "linked"
  | "restored"
  | "revised"
  | "seeded";

// When the page was opened on a hand that is not the player's own undecided one, a link and a reload look the same, so the wording is only what is true of both; "decided" is keyed on cards and role among this device's stored decisions.
export const initialUncountedReason = (
  isSeededSession: boolean,
  isPracticeInitialHand: boolean,
  hasDecidedHand: () => boolean,
): UncountedReason | null => {
  if (isSeededSession) {
    return "seeded";
  }
  if (!isPracticeInitialHand) {
    return null;
  }
  return hasDecidedHand() ? "decided" : "linked";
};

export const replacementReason = (
  cause: HandReplacementCause,
  isSeededSession: boolean,
  isDrillLoad: boolean,
): UncountedReason | null => {
  if (isDrillLoad) {
    return "drill";
  }
  if (cause === "manual") {
    return "entered";
  }
  return isSeededSession ? "seeded" : null;
};

interface CountedSelection {
  readonly captureKey: string;
  readonly handId: string;
  readonly handKey: string;
  readonly revised: boolean;
  readonly unsavedBatch: number | null;
}

const nextCountedSelection = (
  counted: CountedSelection | null,
  handId: string,
  boardCaptureKey: string | null,
): CountedSelection | null => {
  if (counted === null || counted.handId !== handId) {
    return null;
  }
  if (
    (counted.revised || boardCaptureKey !== counted.captureKey) &&
    !isAuthenticDecisionRetained(counted.handKey, counted.unsavedBatch)
  ) {
    return null;
  }
  if (!counted.revised && boardCaptureKey !== counted.captureKey) {
    return { ...counted, revised: true };
  }
  return counted;
};

export const useUncountedReason = (
  boardHandId: string,
  boardCaptureKey: string | null,
  initOriginReason: () => UncountedReason | null,
) => {
  const [originReason, setOriginReason] = useState<UncountedReason | null>(
    initOriginReason,
  );
  const [countedSelection, setCountedSelection] =
    useState<CountedSelection | null>(null);
  const nextCounted = nextCountedSelection(
    countedSelection,
    boardHandId,
    boardCaptureKey,
  );
  if (nextCounted !== countedSelection) {
    setCountedSelection(nextCounted);
  }
  const setHandReason = useCallback((reason: UncountedReason | null) => {
    setOriginReason(reason);
    setCountedSelection(null);
  }, []);
  const markDiscardCounted = useCallback(
    (handId: string, captureKey: string, handKey: string) => {
      setCountedSelection({
        captureKey,
        handId,
        handKey,
        revised: false,
        unsavedBatch: currentUnsavedBatch(),
      });
    },
    [],
  );
  return {
    markDiscardCounted,
    setHandReason,
    uncountedReason: originReason ?? (nextCounted?.revised ? "revised" : null),
  };
};
