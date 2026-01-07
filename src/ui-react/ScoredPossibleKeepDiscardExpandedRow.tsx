/* eslint react/jsx-max-depth: ["error", { "max": 4 }] */
import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import type { BreakdownProps } from "./BreakdownProps";
import { BreakdownSection } from "./BreakdownSection";

interface ScoredPossibleKeepDiscardExpandedRowProps extends BreakdownProps {
  readonly onRowClick: () => void;
}

export function ScoredPossibleKeepDiscardExpandedRow({
  avgCutAdded15s,
  avgCutAddedPairs,
  avgCutAddedRuns,
  fifteensContributions,
  pairsContributions,
  runsContributions,
  onRowClick,
}: ScoredPossibleKeepDiscardExpandedRowProps) {
  return (
    <tr
      className={classes.expandedRow}
      onClick={onRowClick}
    >
      <td colSpan={4}>
        <div className={classes.breakdownContainer}>
          <BreakdownSection
            average={avgCutAdded15s}
            contributions={fifteensContributions}
            label="15s"
          />
          <BreakdownSection
            average={avgCutAddedPairs}
            contributions={pairsContributions}
            label="Pairs"
          />
          <BreakdownSection
            average={avgCutAddedRuns}
            contributions={runsContributions}
            label="Runs"
          />
        </div>
      </td>
    </tr>
  );
}
