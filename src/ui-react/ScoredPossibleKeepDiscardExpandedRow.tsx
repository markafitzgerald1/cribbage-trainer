import * as classes from "./ScoredPossibleKeepDiscardExpandedRow.module.css";
import { type Card, Rank } from "../game/Card";
import {
  CribRole,
  type ExpectedCribPointBreakdown,
  type ExpectedCribStarterSuitRelationPoints,
  STARTER_RANKS,
  type StarterRank,
} from "../game/expectedCribPoints";
import { type CutResult, groupCutsByResults } from "./groupCutsByResults";
import {
  EXPECTED_PLAY_CATEGORY_LABELS,
  getExpectedPlayBreakdownRows,
} from "./getExpectedPlayBreakdownRows";
import { type ReactNode, useCallback, useState } from "react";
import type {
  ScoredKeepDiscard,
  SignedExpectedCribStarterPoints,
} from "../analysis/analysis";
import { CardLabel } from "./CardLabel";
import { CutResultRow } from "./CutResultRow";
import { SortOrder } from "../ui/SortOrder";

const DECIMAL_PLACES = 2;
const ZERO_AVERAGE = "0.00";
const DEALER_MULTIPLIER = 1;
const PONE_MULTIPLIER = -1;
const missingCategoryValue = new Map<string, number>().get("missing");

interface Category {
  readonly isMutedHeader?: boolean;
  readonly label: string;
  readonly notApplicable?: boolean;
  readonly value: number | undefined;
}

interface RenderBreakdownRowOptions {
  readonly ariaExpanded?: boolean;
  readonly className?: string;
  readonly decimalPlaces: number;
  readonly key?: string;
  readonly label: ReactNode;
  readonly onClick?: () => void;
  readonly rowCategories: readonly Category[];
}

interface SummaryLabelOptions {
  readonly content: ReactNode;
  readonly isExpanded: boolean;
}

const createCribCategories = (
  expectedCribPoints: number,
  pointBreakdown: ExpectedCribPointBreakdown | undefined,
  cribRole: CribRole,
) => {
  const multiplier =
    cribRole === CribRole.Dealer ? DEALER_MULTIPLIER : PONE_MULTIPLIER;
  return [
    {
      label: "15s",
      value:
        typeof pointBreakdown?.fifteens === "undefined"
          ? missingCategoryValue
          : pointBreakdown.fifteens * multiplier,
    },
    {
      label: "Pairs",
      value:
        typeof pointBreakdown?.pairs === "undefined"
          ? missingCategoryValue
          : pointBreakdown.pairs * multiplier,
    },
    {
      label: "Runs",
      value:
        typeof pointBreakdown?.runs === "undefined"
          ? missingCategoryValue
          : pointBreakdown.runs * multiplier,
    },
    {
      label: "Flushes",
      value:
        typeof pointBreakdown?.flushes === "undefined"
          ? missingCategoryValue
          : pointBreakdown.flushes * multiplier,
    },
    {
      label: "Nobs",
      value:
        typeof pointBreakdown?.nobs === "undefined"
          ? missingCategoryValue
          : pointBreakdown.nobs * multiplier,
    },
    { label: "Total", value: expectedCribPoints * multiplier },
  ] as const satisfies readonly Category[];
};

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

const renderSummaryLabel = ({ content, isExpanded }: SummaryLabelOptions) => (
  <div className={classes.summaryLabel}>
    <span className={classes.summaryLabelContent}>
      {content}
      {renderExpandIndicator(isExpanded)}
    </span>
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

export interface ScoredPossibleKeepDiscardExpandedRowProps {
  readonly scoredKeepDiscard: ScoredKeepDiscard<Card>;
  readonly sortOrder: SortOrder;
  readonly cribRole: CribRole;
}

const hasRemainingStarters = (starterPoints: SignedExpectedCribStarterPoints) =>
  starterPoints.remainingStarterCount > 0;

const renderNumericValue = (
  value: number | undefined,
  decimalPlaces: number,
) => {
  if (typeof value === "undefined") {
    return <span className={classes.muted}>—</span>;
  }

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

export function ScoredPossibleKeepDiscardExpandedRow({
  scoredKeepDiscard,
  sortOrder,
  cribRole,
}: ScoredPossibleKeepDiscardExpandedRowProps) {
  const {
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
    expectedCribPointBreakdown,
    expectedCribPoints,
    expectedPlayPoints,
    handPointsBreakdown,
  } = scoredKeepDiscard;
  const [areCutDetailsExpanded, setAreCutDetailsExpanded] = useState(false);
  const [areCribDetailsExpanded, setAreCribDetailsExpanded] = useState(false);
  const [arePlayDetailsExpanded, setArePlayDetailsExpanded] = useState(true);
  const cutResults = groupCutsByResults({
    discard,
    fifteens: fifteensContributions,
    flushes: flushesContributions,
    keep,
    nobs: nobsContributions,
    pairs: pairsContributions,
    runs: runsContributions,
  });
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
    {
      label: "Total",
      value:
        avgCutAdded15s +
        avgCutAddedPairs +
        avgCutAddedRuns +
        avgCutAddedFlushes +
        avgCutAddedNobs,
    },
  ];
  const handCategories: readonly Category[] = [
    { label: "15s", value: handPointsBreakdown.fifteens },
    { label: "Pairs", value: handPointsBreakdown.pairs },
    { label: "Runs", value: handPointsBreakdown.runs },
    { label: "Flushes", value: handPointsBreakdown.flushes },
    { label: "Nobs", notApplicable: true, value: handPointsBreakdown.nobs },
    { label: "Total", value: handPointsBreakdown.total },
  ];
  const handleExpandedRowClick = useCallback(() => {
    setAreCutDetailsExpanded((expanded) => !expanded);
  }, []);
  const handleCribExpandedRowClick = useCallback(() => {
    setAreCribDetailsExpanded((expanded) => !expanded);
  }, []);
  const handlePlayExpandedRowClick = useCallback(() => {
    setArePlayDetailsExpanded((expanded) => !expanded);
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
  const renderLabel = (label: ReactNode) => {
    if (label === "+Cut avg") {
      return renderSummaryLabel({
        content: "+Cut avg",
        isExpanded: areCutDetailsExpanded,
      });
    }
    if (label === "Crib avg") {
      return renderSummaryLabel({
        content: "Crib avg",
        isExpanded: areCribDetailsExpanded,
      });
    }
    if (label === "You - Opp") {
      return renderSummaryLabel({
        content: "You - Opp",
        isExpanded: arePlayDetailsExpanded,
      });
    }
    return <div className={classes.summaryLabel}>{label}</div>;
  };
  const renderBreakdownRowContent = (
    label: ReactNode,
    rowCategories: readonly Category[],
    decimalPlaces: number,
  ) => (
    <>
      {renderLabel(label)}
      {rowCategories.map((cat) => renderBreakdownValue(cat, decimalPlaces))}
    </>
  );
  const renderBreakdownRow = ({
    ariaExpanded,
    className = "",
    decimalPlaces,
    key,
    label,
    onClick,
    rowCategories,
  }: RenderBreakdownRowOptions) => {
    const classNames = [
      classes.breakdownSummary,
      onClick && classes.breakdownSummaryButton,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    if (onClick) {
      return (
        <button
          aria-expanded={ariaExpanded}
          className={classNames}
          key={key}
          onClick={onClick}
          type="button"
        >
          {renderBreakdownRowContent(label, rowCategories, decimalPlaces)}
        </button>
      );
    }

    return (
      <div
        className={classNames}
        key={key}
      >
        {renderBreakdownRowContent(label, rowCategories, decimalPlaces)}
      </div>
    );
  };
  const renderCribStarterRow = ({
    expectedCribPoints: starterCribPoints,
    pointBreakdown,
    starterRank,
  }: SignedExpectedCribStarterPoints) =>
    renderBreakdownRow({
      className: classes.starterDetailRow,
      decimalPlaces: DECIMAL_PLACES,
      key: starterRank,
      label: <CardLabel rank={starterRankToRank(starterRank)} />,
      rowCategories: createCribCategories(
        starterCribPoints,
        pointBreakdown,
        cribRole,
      ),
    });
  const renderCribStarterRelationRow = ({
    expectedCribPoints: relationCribPoints,
    pointBreakdown,
    relation,
    starterRank,
    suits,
  }: ExpectedCribStarterSuitRelationPoints) =>
    renderBreakdownRow({
      className: classes.starterDetailRow,
      decimalPlaces: DECIMAL_PLACES,
      key: `${starterRank}:${relation}`,
      label: (
        <CardLabel
          rank={starterRankToRank(starterRank)}
          suits={suits}
        />
      ),
      rowCategories: createCribCategories(
        relationCribPoints,
        pointBreakdown,
        cribRole,
      ),
    });
  const renderCribStarterRows = (
    starterPoints: SignedExpectedCribStarterPoints,
  ) =>
    starterPoints.starterSuitRelationPoints.length > 0
      ? starterPoints.starterSuitRelationPoints.map(
          renderCribStarterRelationRow,
        )
      : renderCribStarterRow(starterPoints);

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
  const renderPlayBreakdown = () => {
    const [ponePlayRow, dealerPlayRow, youOppPlayRow] =
      getExpectedPlayBreakdownRows(expectedPlayPoints, cribRole);
    const perSeatPlayRows = [ponePlayRow, dealerPlayRow];
    return (
      <div className={classes.playBreakdown}>
        <div className={classes.playBreakdownHeader}>
          <div className={`${classes.cutsHeader} ${classes.noWrap}`}>
            Peg avg
          </div>
          {EXPECTED_PLAY_CATEGORY_LABELS.map((label) => (
            <div
              className={classes.categoryHeader}
              key={label}
            >
              {label}
            </div>
          ))}
        </div>
        {renderBreakdownRow({
          ariaExpanded: arePlayDetailsExpanded,
          className: classes.playBreakdownRow,
          decimalPlaces: DECIMAL_PLACES,
          key: youOppPlayRow.label,
          label: youOppPlayRow.label,
          onClick: handlePlayExpandedRowClick,
          rowCategories: youOppPlayRow.categories,
        })}
        {arePlayDetailsExpanded
          ? perSeatPlayRows.map(({ categories, label }) =>
              renderBreakdownRow({
                className: classes.playBreakdownRow,
                decimalPlaces: DECIMAL_PLACES,
                key: label,
                label,
                rowCategories: categories,
              }),
            )
          : null}
      </div>
    );
  };

  return (
    <tr className={classes.expandedRow}>
      <td colSpan={5}>
        <div className={classes.breakdownContainer}>
          {renderHeader()}
          {renderBreakdownRow({
            decimalPlaces: 0,
            label: "Hand",
            rowCategories: handCategories,
          })}
          {renderBreakdownRow({
            ariaExpanded: areCutDetailsExpanded,
            decimalPlaces: DECIMAL_PLACES,
            label: "+Cut avg",
            onClick: handleExpandedRowClick,
            rowCategories: starterCategories,
          })}
          {areCutDetailsExpanded ? (
            <div className={classes.cutResultsList}>
              {cutResults.map(renderCutResult)}
            </div>
          ) : null}
          {renderBreakdownRow({
            ariaExpanded: areCribDetailsExpanded,
            decimalPlaces: DECIMAL_PLACES,
            label: "Crib avg",
            onClick: handleCribExpandedRowClick,
            rowCategories: createCribCategories(
              expectedCribPoints,
              expectedCribPointBreakdown,
              cribRole,
            ),
          })}
          {areCribDetailsExpanded ? (
            <div className={classes.cribStarterList}>
              {cribStarterPoints
                .filter(hasRemainingStarters)
                .map(renderCribStarterRows)}
            </div>
          ) : null}
          {renderPlayBreakdown()}
        </div>
      </td>
    </tr>
  );
}
