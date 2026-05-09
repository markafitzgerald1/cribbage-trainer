import * as classes from "./ScoredPossibleKeepDiscardExpandedRow.module.css";
import {
  type CutResult,
  type MinimalCard,
  groupCutsByResults,
} from "./groupCutsByResults";
import type { BreakdownProps } from "./BreakdownProps";
import { CutResultRow } from "./CutResultRow";
import { SortOrder } from "../ui/SortOrder";

const DECIMAL_PLACES = 2;
const ZERO_AVERAGE = "0.00";

function getCutResultKey(result: CutResult): string {
  const cutsKey = result.cuts
    .map((item) =>
      typeof item === "number" ? item : `${item.rank}${item.suit}`,
    )
    .join(",");

  return [
    cutsKey,
    result.fifteensPoints,
    result.pairsPoints,
    result.runsPoints,
    result.flushesPoints,
    result.nobsPoints,
    result.totalPoints,
  ].join(":");
}

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
  const totalAvg =
    avgCutAdded15s +
    avgCutAddedPairs +
    avgCutAddedRuns +
    avgCutAddedFlushes +
    avgCutAddedNobs;

  const categories = [
    { label: "15s", value: avgCutAdded15s },
    { label: "Pairs", value: avgCutAddedPairs },
    {
      isMutedHeader: avgCutAddedRuns === 0,
      label: "Runs",
      value: avgCutAddedRuns,
    },
    {
      isMutedHeader: avgCutAddedFlushes === 0,
      label: "Flushes",
      value: avgCutAddedFlushes,
    },
    {
      isMutedHeader: avgCutAddedNobs === 0,
      label: "Nobs",
      value: avgCutAddedNobs,
    },
    { label: "Total", value: totalAvg },
  ];
  const renderAverage = (value: number) => {
    const formatted = value.toFixed(DECIMAL_PLACES);

    return formatted === ZERO_AVERAGE ? (
      <span className={classes.muted}>—</span>
    ) : (
      formatted
    );
  };

  const renderHeader = () => (
    <div className={classes.breakdownHeader}>
      <div className={classes.cutsHeader}>Cuts</div>
      {categories.map((cat) => (
        <div
          className={[
            classes.categoryHeader,
            cat.isMutedHeader && classes.muted,
          ]
            .filter(Boolean)
            .join(" ")}
          key={cat.label}
        >
          {cat.label}
        </div>
      ))}
    </div>
  );

  const renderSummary = () => (
    <div className={classes.breakdownSummary}>
      <div className={classes.summaryLabel} />
      {categories.map((cat) => (
        <div
          className={
            cat.label === "Total" ? classes.summaryTotal : classes.summaryValue
          }
          key={cat.label}
        >
          {renderAverage(cat.value)}
        </div>
      ))}
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
                fifteensPoints={result.fifteensPoints}
                flushesPoints={result.flushesPoints}
                key={getCutResultKey(result)}
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
