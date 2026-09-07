import type { PracticeDrillPanelProps } from "./PracticeDrillPanel";
import type { PracticeVerdict } from "./usePracticeDrill";
import { SortOrder } from "../ui/SortOrder";

const OPTIMAL_VERDICT: PracticeVerdict = {
  chosenDiscard: "5H,6H",
  chosenLoss: 0,
  consecutiveSuccesses: 1,
  isMastered: false,
  isOptimal: true,
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
