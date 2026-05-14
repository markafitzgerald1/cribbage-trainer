import * as classes from "./ScoredPossibleKeepDiscardExpandedRow.module.css";
import {
  type CutResult,
  type MinimalCard,
  groupCutsByResults,
} from "./groupCutsByResults";
import { useCallback, useState } from "react";
import type { BreakdownProps } from "./BreakdownProps";
import { CutResultRow } from "./CutResultRow";
import type { HandPoints } from "../game/handPoints";
import { SortOrder } from "../ui/SortOrder";

const DECIMAL_PLACES = 2;
const ZERO_AVERAGE = "0.00";

interface Category {
  readonly isMutedHeader?: boolean;
  readonly label: string;
  readonly notApplicable?: boolean;
  readonly value: number;
}

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
  readonly handPointsBreakdown: HandPoints;
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
  handPointsBreakdown,
  sortOrder,
}: ScoredPossibleKeepDiscardExpandedRowProps) {
  const [areCutDetailsExpanded, setAreCutDetailsExpanded] = useState(false);
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

  const starterCategories: readonly Category[] = [
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
  const handCategories: readonly Category[] = [
    { label: "15s", value: handPointsBreakdown.fifteens },
    { label: "Pairs", value: handPointsBreakdown.pairs },
    { label: "Runs", value: handPointsBreakdown.runs },
    { label: "Flushes", value: handPointsBreakdown.flushes },
    { label: "Nobs", notApplicable: true, value: handPointsBreakdown.nobs },
    { label: "Total", value: handPointsBreakdown.total },
  ];
  const renderNumericValue = (value: number, decimalPlaces: number) => {
    const formatted = value.toFixed(decimalPlaces);

    return formatted === ZERO_AVERAGE || formatted === "0" ? (
      <span className={classes.muted}>—</span>
    ) : (
      formatted
    );
  };
  const renderCategoryValue = (cat: Category, decimalPlaces: number) =>
    cat.notApplicable ? (
      <span
        className={classes.notApplicable}
        title="Not applicable before starter"
      >
        X
      </span>
    ) : (
      renderNumericValue(cat.value, decimalPlaces)
    );
  const handleExpandedRowClick = useCallback(() => {
    setAreCutDetailsExpanded((expanded) => !expanded);
  }, []);
  const renderCutResult = (result: CutResult) => (
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
  );
  const renderBreakdownValue = (
    cat: Category,
    decimalPlaces: number,
    rowLabel: string,
  ) => (
    <div
      className={
        cat.label === "Total" && rowLabel !== "Hand"
          ? classes.summaryTotal
          : classes.summaryValue
      }
      key={cat.label}
    >
      {renderCategoryValue(cat, decimalPlaces)}
    </div>
  );
  const renderLabel = (label: string) => (
    <div className={classes.summaryLabel}>
      {label}
      {label === "Starter avg" ? (
        <span
          className={`${classes.expandIndicator} ${
            areCutDetailsExpanded ? classes.expandIndicatorExpanded : ""
          }`}
        >
          ▸
        </span>
      ) : null}
    </div>
  );
  const renderBreakdownRow = (
    label: string,
    rowCategories: readonly Category[],
    decimalPlaces: number,
  ) => (
    <div className={classes.breakdownSummary}>
      {renderLabel(label)}
      {rowCategories.map((cat) =>
        renderBreakdownValue(cat, decimalPlaces, label),
      )}
    </div>
  );

  const renderHeader = () => (
    <div className={classes.breakdownHeader}>
      <div className={classes.cutsHeader}>Points</div>
      {starterCategories.map((cat) => (
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

  return (
    <tr
      className={classes.expandedRow}
      onClick={handleExpandedRowClick}
    >
      <td colSpan={4}>
        <div className={classes.breakdownContainer}>
          {renderHeader()}
          {renderBreakdownRow("Hand", handCategories, 0)}
          {renderBreakdownRow("Starter avg", starterCategories, DECIMAL_PLACES)}
          {areCutDetailsExpanded ? (
            <div className={classes.cutResultsList}>
              {cutResults.map(renderCutResult)}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
