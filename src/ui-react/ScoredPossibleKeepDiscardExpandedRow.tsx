/* eslint react/jsx-max-depth: ["error", { "max": 4 }] */
import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import type { BreakdownProps } from "./BreakdownProps";
import { CutResultRow } from "./CutResultRow";
import { SortOrder } from "../ui/SortOrder";
import { groupCutsByResults } from "./groupCutsByResults";

const DECIMAL_PLACES = 2;

interface ScoredPossibleKeepDiscardExpandedRowProps extends BreakdownProps {
  readonly onRowClick: () => void;
  readonly sortOrder: SortOrder;
}

export function ScoredPossibleKeepDiscardExpandedRow({
  avgCutAdded15s,
  avgCutAddedPairs,
  avgCutAddedRuns,
  cutCountsRemaining,
  fifteensContributions,
  pairsContributions,
  runsContributions,
  onRowClick,
  sortOrder,
}: ScoredPossibleKeepDiscardExpandedRowProps) {
  const cutResults = groupCutsByResults({
    cutCountsRemaining,
    fifteens: fifteensContributions,
    pairs: pairsContributions,
    runs: runsContributions,
  });

  return (
    <tr
      className={classes.expandedRow}
      onClick={onRowClick}
    >
      <td colSpan={4}>
        <div className={classes.breakdownContainer}>
          <div className={classes.breakdownHeader}>
            <div className={classes.cutsHeader}>Cuts</div>
            <div className={classes.categoryHeader}>15s</div>
            <div className={classes.categoryHeader}>Pairs</div>
            <div className={classes.categoryHeader}>Runs</div>
            <div className={classes.totalHeader}>Total</div>
          </div>
          <div className={classes.breakdownSummary}>
            <div className={classes.summaryLabel} />
            <div className={classes.summaryValue}>
              {avgCutAdded15s.toFixed(DECIMAL_PLACES)}
            </div>
            <div className={classes.summaryValue}>
              {avgCutAddedPairs.toFixed(DECIMAL_PLACES)}
            </div>
            <div className={classes.summaryValue}>
              {avgCutAddedRuns.toFixed(DECIMAL_PLACES)}
            </div>
            <div className={classes.summaryTotal}>
              {(avgCutAdded15s + avgCutAddedPairs + avgCutAddedRuns).toFixed(
                DECIMAL_PLACES,
              )}
            </div>
          </div>
          <div className={classes.cutResultsList}>
            {cutResults.map((result) => (
              <CutResultRow
                cuts={result.cuts}
                fifteensPoints={result.fifteensPoints}
                key={result.cuts.join(",")}
                pairsPoints={result.pairsPoints}
                runsPoints={result.runsPoints}
                sortOrder={sortOrder}
                totalPoints={result.totalPoints}
              />
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}
