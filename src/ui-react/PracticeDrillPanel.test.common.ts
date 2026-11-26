import type { PracticeDrillPanelProps } from "./PracticeDrillPanel";
import type { PracticeVerdict } from "./usePracticeDrill";
import { SortOrder } from "../ui/SortOrder";

const OPTIMAL_VERDICT: PracticeVerdict = {
  chosenDiscard: "5H,6H",
  chosenLoss: 0,
  consecutiveSuccesses: 1,
  isMastered: false,
  isOptimal: true,
  isWithinNoise: false,
  previousDiscard: "7C,8C",
  previousLoss: 1.42,
};

export const sampleVerdict = (
  overrides: Partial<PracticeVerdict> = {},
): PracticeVerdict => ({ ...OPTIMAL_VERDICT, ...overrides });

export const basePanelArgs = (
  overrides: Partial<PracticeDrillPanelProps> = {},
): PracticeDrillPanelProps => ({
  canCommit: true,
  hasNextHand: true,
  onCommit: () => null,
  onExit: () => null,
  onNextHand: () => null,
  phase: "choosing",
  sortOrder: SortOrder.DealOrder,
  verdict: null,
  ...overrides,
});

export const retryIdentity = {
  crib: { means_sha256: "d".repeat(64) },
  play: { means_sha256: "e".repeat(64) },
};
export const originalIdentity = {
  ...retryIdentity,
  play: { means_sha256: "f".repeat(64) },
};
export const changedVerdict = () =>
  sampleVerdict({
    originalTableIdentity: originalIdentity,
    retryTableIdentity: retryIdentity,
  });
export const changedTablesNote =
  "Tables changed since this decision. Its recorded cost is from the original tables; this retry uses the current tables.";
export const unknownTablesNote =
  "The original tables were not recorded. This retry uses current tables.";

export const currentVerdict = () =>
  sampleVerdict({
    originalTableIdentity: retryIdentity,
    retryTableIdentity: retryIdentity,
  });
export const revealedPanelArgs = (verdict: PracticeVerdict) => ({
  phase: "revealed" as const,
  verdict,
});

export const failedVerdict = (chosenLoss: number) =>
  sampleVerdict({ chosenLoss, consecutiveSuccesses: 0, isOptimal: false });
