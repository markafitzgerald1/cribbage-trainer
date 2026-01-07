import type { CutContribution } from "../game/expectedCutAddedPoints";

export interface BreakdownProps {
  readonly avgCutAdded15s: number;
  readonly avgCutAddedPairs: number;
  readonly avgCutAddedRuns: number;
  readonly fifteensContributions: CutContribution[];
  readonly pairsContributions: CutContribution[];
  readonly runsContributions: CutContribution[];
}
