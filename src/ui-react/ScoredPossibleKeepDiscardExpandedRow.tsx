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

  const categories = [
    { label: "15s", value: avgCutAdded15s },
    { label: "Pairs", value: avgCutAddedPairs },
    { label: "Runs", value: avgCutAddedRuns },
    { label: "Flushes", value: avgCutAddedFlushes },
    { label: "Nobs", value: avgCutAddedNobs },
  ];

  const totalAvg = categories.reduce((sum, cat) => sum + cat.value, 0);

  const renderHeader = () => (
    <div className={classes.breakdownHeader}>
      <div className={classes.cutsHeader}>Cuts</div>
      {categories.map((cat) => (
        <div
          className={classes.categoryHeader}
          key={cat.label}
        >
          {cat.label}
        </div>
      ))}
      <div className={classes.totalHeader}>Total</div>
    </div>
  );

  const renderSummary = () => (
    <div className={classes.breakdownSummary}>
      <div className={classes.summaryLabel} />
      {categories.map((cat) => (
        <div
          className={classes.summaryValue}
          key={cat.label}
        >
          {cat.value.toFixed(DECIMAL_PLACES)}
        </div>
      ))}
      <div className={classes.summaryTotal}>
        {totalAvg.toFixed(DECIMAL_PLACES)}
      </div>
    </div>
  );

  return (
    <tr
      className={classes.expandedRow}
      onClick={onRowClick}
    >
      <td colSpan={8}>
        <div className={classes.breakdownContainer}>
          {renderHeader()}
          {renderSummary()}
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
