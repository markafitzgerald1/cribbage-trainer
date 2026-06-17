import * as classes from "./ScoredPossibleKeepDiscardExpandedRow.module.css";
import {
  type CutResult,
  type MinimalCard,
  groupCutsByResults,
} from "./groupCutsByResults";
import { type ReactNode, useCallback, useState } from "react";
import { STARTER_RANKS, type StarterRank } from "../game/expectedCribPoints";
import type { BreakdownProps } from "./BreakdownProps";
import { CardLabel } from "./CardLabel";
import { CutResultRow } from "./CutResultRow";
import type { HandPoints } from "../game/handPoints";
import type { Rank } from "../game/Card";
import type { SignedExpectedCribStarterPoints } from "../analysis/analysis";
import { SortOrder } from "../ui/SortOrder";

const DECIMAL_PLACES = 2;
const ZERO_AVERAGE = "0.00";

interface Category {
  readonly isMutedHeader?: boolean;
  readonly label: string;
  readonly notApplicable?: boolean;
  readonly value: number;
}

interface RenderBreakdownRowOptions {
  readonly className?: string;
  readonly decimalPlaces: number;
  readonly key?: string;
  readonly label: ReactNode;
  readonly rowCategories: readonly Category[];
}

interface SummaryLabelButtonOptions {
  readonly content: ReactNode;
  readonly isExpanded: boolean;
  readonly onClick: () => void;
}

const createCribCategories = (signedExpectedCribPoints: number) =>
  [
    { label: "15s", value: 0 },
    { label: "Pairs", value: 0 },
    { label: "Runs", value: 0 },
    { label: "Flushes", value: 0 },
    { label: "Nobs", value: 0 },
    { label: "Total", value: Math.abs(signedExpectedCribPoints) },
  ] as const satisfies readonly Category[];

const starterRankToRank = (starterRank: StarterRank): Rank =>
  STARTER_RANKS.indexOf(starterRank) as Rank;

const renderExpandIndicator = (isExpanded: boolean) => (
  <span
    className={`${classes.expandIndicator} ${
      isExpanded ? classes.expandIndicatorExpanded : ""
    }`}
  >
    ▸
  </span>
);

const renderSummaryLabelButton = ({
  content,
  isExpanded,
  onClick,
}: SummaryLabelButtonOptions) => (
  <div className={classes.summaryLabel}>
    <button
      className={classes.summaryLabelButton}
      onClick={onClick}
      type="button"
    >
      {content}
      {renderExpandIndicator(isExpanded)}
    </button>
  </div>
);

function getCutResultKey(result: CutResult): string {
  const cutsKey = result.cuts
    .map(
      (item) =>
        `${item.rank}:${item.isAllRemaining ? "all" : item.suits.join(",")}`,
    )
    .join("|");

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
  readonly cribStarterPoints: readonly SignedExpectedCribStarterPoints[];
  readonly handPointsBreakdown: HandPoints;
  readonly signedExpectedCribPoints: number;
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
  cribStarterPoints,
  handPointsBreakdown,
  signedExpectedCribPoints,
  sortOrder,
}: ScoredPossibleKeepDiscardExpandedRowProps) {
  const [areCutDetailsExpanded, setAreCutDetailsExpanded] = useState(false);
  const [areCribDetailsExpanded, setAreCribDetailsExpanded] = useState(false);
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
  const cribCategories = createCribCategories(signedExpectedCribPoints);
  const possibleCribStarterPoints = cribStarterPoints.filter(
    (starterPoints) => starterPoints.remainingStarterCount > 0,
  );
  const renderNumericValue = (value: number, decimalPlaces: number) => {
    const formatted = value.toFixed(decimalPlaces);

    if (formatted === ZERO_AVERAGE || formatted === "0") {
      return <span className={classes.muted}>—</span>;
    }

    return formatted;
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
  const handleCribExpandedRowClick = useCallback(() => {
    setAreCribDetailsExpanded((expanded) => !expanded);
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
  const renderBreakdownValue = (cat: Category, decimalPlaces: number) => (
    <div
      className={
        cat.label === "Total" ? classes.summaryTotal : classes.summaryValue
      }
      key={cat.label}
    >
      {renderCategoryValue(cat, decimalPlaces)}
    </div>
  );
  const renderLabel = (label: ReactNode) => {
    if (label === "Hand starter avg") {
      return renderSummaryLabelButton({
        content: (
          <>
            Hand starter <span className={classes.noWrap}>avg</span>
          </>
        ),
        isExpanded: areCutDetailsExpanded,
        onClick: handleExpandedRowClick,
      });
    }
    if (label === "Crib avg") {
      return renderSummaryLabelButton({
        content: "Crib avg",
        isExpanded: areCribDetailsExpanded,
        onClick: handleCribExpandedRowClick,
      });
    }
    return <div className={classes.summaryLabel}>{label}</div>;
  };
  const renderBreakdownRow = ({
    className = "",
    decimalPlaces,
    key,
    label,
    rowCategories,
  }: RenderBreakdownRowOptions) => (
    <div
      className={`${classes.breakdownSummary} ${className}`}
      key={key}
    >
      {renderLabel(label)}
      {rowCategories.map((cat) => renderBreakdownValue(cat, decimalPlaces))}
    </div>
  );
  const renderCribStarterRow = ({
    signedExpectedCribPoints: starterCribPoints,
    starterRank,
  }: SignedExpectedCribStarterPoints) =>
    renderBreakdownRow({
      className: classes.starterDetailRow,
      decimalPlaces: DECIMAL_PLACES,
      key: starterRank,
      label: <CardLabel rank={starterRankToRank(starterRank)} />,
      rowCategories: createCribCategories(starterCribPoints),
    });

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
    <tr className={classes.expandedRow}>
      <td colSpan={4}>
        <div className={classes.breakdownContainer}>
          {renderHeader()}
          {renderBreakdownRow({
            decimalPlaces: 0,
            label: "Hand",
            rowCategories: handCategories,
          })}
          {renderBreakdownRow({
            decimalPlaces: DECIMAL_PLACES,
            label: "Hand starter avg",
            rowCategories: starterCategories,
          })}
          {areCutDetailsExpanded ? (
            <div className={classes.cutResultsList}>
              {cutResults.map(renderCutResult)}
            </div>
          ) : null}
          {renderBreakdownRow({
            decimalPlaces: DECIMAL_PLACES,
            label: "Crib avg",
            rowCategories: cribCategories,
          })}
          {areCribDetailsExpanded ? (
            <div className={classes.cribStarterList}>
              {possibleCribStarterPoints.map(renderCribStarterRow)}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
