import type { HandReplacementCause } from "./useDiscardTelemetry";

// Which observed cause the tally filed the hand on screen under. The note is set wherever the tally's practice flag is set; this chooses its wording.
export type UncountedReason =
  "decided" | "drill" | "entered" | "linked" | "restored" | "seeded";

// The page was opened on this hand: a link and a reload look the same, so the wording is only what is true of both; "decided" is keyed on cards and role among this device's stored decisions.
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
