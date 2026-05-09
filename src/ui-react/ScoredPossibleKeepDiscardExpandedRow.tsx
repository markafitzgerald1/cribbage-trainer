import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import type { BreakdownProps } from "./BreakdownProps";
import { CutResultRow } from "./CutResultRow";
import { SortOrder } from "../ui/SortOrder";
import { groupCutsByResults } from "./groupCutsByResults";

const DECIMAL_PLACES = 2;

export interface ScoredPossibleKeepDiscardExpandedRowProps extends BreakdownProps {
  readonly onRowClick: () => void;
  readonly sortOrder: SortOrder;
}

export function ScoredPossibleKeepDiscardExpandedRow({
  avgCutAdded15s,
  avgCutAddedPairs,
  avgCutAddedRuns,
  avgCutAddedFlushes,
  avgCutAddedNobs,
  cutCountsRemaining,
  fifteensContributions,
  pairsContributions,
  runsContributions,
  flushesContributions,
  nobsContributions,
  onRowClick,
  sortOrder,
}: ScoredPossibleKeepDiscardExpandedRowProps) {
  const cutResults = groupCutsByResults({
    cutCountsRemaining,
    fifteens: fifteensContributions,
    flushes: flushesContributions,
    nobs: nobsContributions,
    pairs: pairsContributions,
    runs: runsContributions,
  });

  return (
    <tr
      className={classes.expandedRow}
      onClick={onRowClick}
    >
      <td colSpan={8}>
        <div className={classes.breakdownContainer}>
          <div className={classes.breakdownHeader}>
            <div className={classes.cutsHeader}>Cuts</div>
            <div className={classes.categoryHeader}>15s</div>
            <div className={classes.categoryHeader}>Pairs</div>
            <div className={classes.categoryHeader}>Runs</div>
            <div className={classes.categoryHeader}>Flushes</div>
            <div className={classes.categoryHeader}>Nobs</div>
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
            <div className={classes.summaryValue}>
              {avgCutAddedFlushes.toFixed(DECIMAL_PLACES)}
            </div>
            <div className={classes.summaryValue}>
              {avgCutAddedNobs.toFixed(DECIMAL_PLACES)}
            </div>
            <div className={classes.summaryTotal}>
              {(
                avgCutAdded15s +
                avgCutAddedPairs +
                avgCutAddedRuns +
                avgCutAddedFlushes +
                avgCutAddedNobs
              ).toFixed(DECIMAL_PLACES)}
            </div>
          </div>
          <div className={classes.cutResultsList}>
            {cutResults.map((result) => (
              <CutResultRow
                cuts={result.cuts}
                fifteensPoints={result.fifteensPoints}
                flushesPoints={result.flushesPoints}
                key={result.cuts.join(",")}
                nobsPoints={result.nobsPoints}
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
