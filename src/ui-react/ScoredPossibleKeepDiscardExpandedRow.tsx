import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import { type MinimalCard, groupCutsByResults } from "./groupCutsByResults";
import type { BreakdownProps } from "./BreakdownProps";
import { CutResultRow } from "./CutResultRow";
import { SortOrder } from "../ui/SortOrder";

const DECIMAL_PLACES = 2;

export interface ScoredPossibleKeepDiscardExpandedRowProps extends BreakdownProps {
  readonly keep: readonly MinimalCard[];
  readonly discard: readonly MinimalCard[];
  readonly onRowClick: () => void;
  readonly sortOrder: SortOrder;
}

export function ScoredPossibleKeepDiscardExpandedRow({
  avgCutAdded15s,
  avgCutAddedPairs,
  avgCutAddedRuns,
  avgCutAddedFlushes,
  avgCutAddedNobs,
  fifteensContributions,
  pairsContributions,
  runsContributions,
  flushesContributions,
  nobsContributions,
  keep,
  discard,
  onRowClick,
  sortOrder,
}: ScoredPossibleKeepDiscardExpandedRowProps) {
  const cutResults = groupCutsByResults({
    discard,
    fifteens: fifteensContributions,
    flushes: flushesContributions,
    keep,
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
      <td colSpan={4}>
        <div className={classes.breakdownContainer}>
          {renderHeader()}
          {renderSummary()}
          <div className={classes.cutResultsList}>
            {cutResults.map((result) => (
              <CutResultRow
                cuts={result.cuts}
                key={result.cuts
                  .map((item) =>
                    typeof item === "number"
                      ? item
                      : `${item.rank}${item.suit}`,
                  )
                  .join(",")}
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
