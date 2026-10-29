import type { HandReplacementCause } from "./useDiscardTelemetry";

// Why the tally leaves the hand on screen out; the note is shown exactly when the tally's own practice flag is set, and this says which of the observed causes it was.
export type UncountedReason = "entered" | "linked" | "restored" | "seeded";

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
