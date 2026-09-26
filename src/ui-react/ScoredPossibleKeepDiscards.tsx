import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import { type MouseEvent, useCallback, useEffect, useMemo } from "react";
import {
  ScoredKeepDiscardSortKey,
  compareByExpectedScoreThenRankDescending,
} from "../analysis/compareByExpectedScoreDescending";
import type { DealtCard } from "../game/DealtCard";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { type UncertaintySource } from "../game/uncertaintyLoader";
import { allScoredKeepDiscardsByExpectedNetScoreDescending } from "../analysis/analysis";
import { renderRoleLossPairText } from "./RoleLossPairText";
import { shippedCribUncertainty } from "../game/cribUncertaintyLoader";
import { shippedPlayUncertainty } from "../game/playUncertaintyLoader";
import { useChosenDiagnosticInfo } from "./useChosenDiagnosticInfo";
import { useExpectedTables } from "./useExpectedTables";
import { useScoredKeepDiscardRows } from "./useScoredKeepDiscardRows";

export interface ScoredPossibleKeepDiscardsProps {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];
  readonly isPracticeDrill?: boolean;

  /**
   * Loads the crib EV table. Injectable so stories and tests can exercise the
   * load-failure path without module mocking; defaults to the shared loader.
   */
  readonly loadCribTable?: () => Promise<ExpectedCribPointsTable>;

  /**
   * Where each published uncertainty sidecar is read from, deferred until the
   * means are on screen. An absent or rejected sidecar leaves the means-only
   * recommendation exactly as it is. Injectable as one object apiece so a
   * caller's source is the only thing the table can show; pass stable ones,
   * since they are effect dependencies.
   */
  readonly cribUncertaintySource?: UncertaintySource;
  readonly loadPlayTable?: () => Promise<ExpectedPlayPointsTable>;
  readonly playUncertaintySource?: UncertaintySource;

  /**
   * Called once the ranked results are actually on screen, which telemetry
   * needs to tell an answer the user saw from one that never arrived. It
   * carries what those results say about the discard the user chose, since
   * nothing outside this component has scored them.
   */
  readonly onAnalysisRendered: (analysis: RenderedAnalysis) => void;
  readonly onScoreSortKeyChange: (
    scoreSortKey: ScoredKeepDiscardSortKey,
  ) => void;

  /**
   * Receives the discard verdict for the page's live region; an empty string
   * clears it.
   */
  readonly onStatusChange?: ((statusText: string) => void) | null;
  readonly scoreSortKey: ScoredKeepDiscardSortKey;
  readonly sortOrder: SortOrder;
}

const getScoringHeaders = () =>
  [
    {
      key: ScoredKeepDiscardSortKey.ExpectedHandPoints,
      label: "Hand",
      title: "Sort by expected hand points",
    },
    {
      key: ScoredKeepDiscardSortKey.ExpectedCribPoints,
      label: "Crib",
      title: "Sort by signed expected crib points",
    },
    {
      key: ScoredKeepDiscardSortKey.ExpectedPlayPoints,
      label: "Play",
      title: "Sort by expected pegging-point difference",
    },
    {
      key: ScoredKeepDiscardSortKey.ExpectedNetPoints,
      label: "Net",
      title: "Sort by net expected points",
    },
  ] as const;

const scoreColumnClass = (key: ScoredKeepDiscardSortKey): string => {
  if (key === ScoredKeepDiscardSortKey.ExpectedPlayPoints) {
    return classes.playScoreColumn;
  }
  if (key === ScoredKeepDiscardSortKey.ExpectedNetPoints) {
    return classes.netScoreColumn;
  }
  return classes.scoreColumn;
};

export function ScoredPossibleKeepDiscards({
  cribRole,
  dealtCards,
  isPracticeDrill = false,
  cribUncertaintySource = shippedCribUncertainty,
  loadCribTable = cribLoader.loadTable,
  loadPlayTable = playLoader.loadTable,
  playUncertaintySource = shippedPlayUncertainty,
  onAnalysisRendered,
  onScoreSortKeyChange,
  onStatusChange,
  scoreSortKey,
  sortOrder,
}: ScoredPossibleKeepDiscardsProps) {
  const { handleRetry, loadError, tables } = useExpectedTables(
    loadCribTable,
    loadPlayTable,
  );

  const scoredKeepDiscardsByNetScore = useMemo(
    () =>
      tables
        ? allScoredKeepDiscardsByExpectedNetScoreDescending(
            dealtCards,
            cribRole,
            tables,
          )
        : [],
    [cribRole, dealtCards, tables],
  );
  const {
    captionAriaLabel,
    chosenClassification,
    oppositeRoleLoss,
    optimalMargin,
    quality,
    rolePair,
    sidecars,
    withinNoiseThreshold,
  } = useChosenDiagnosticInfo({
    cribRole,
    cribUncertaintySource,
    dealtCards,
    playUncertaintySource,
    scoredOptions: scoredKeepDiscardsByNetScore,
    tables,
  });
  const renderedAnalysis = useMemo(
    (): RenderedAnalysis => ({
      cribRole,
      oppositeRoleExpectedPointsLoss: oppositeRoleLoss,
      quality,
    }),
    [cribRole, oppositeRoleLoss, quality],
  );
  useEffect(() => {
    // The scored options are a dependency because Back and Forward swap the hand while this component stays mounted.
    if (tables !== null) {
      onAnalysisRendered(renderedAnalysis);
    }
  }, [onAnalysisRendered, renderedAnalysis, tables]);
  // Separate from the report above: a sub-optimal verdict now arrives after the sidecars settle (#774), and sharing one effect re-sent the analysis each time the caption changed.
  useEffect(() => {
    if (captionAriaLabel !== null) {
      onStatusChange?.(captionAriaLabel);
    }
    return () => {
      onStatusChange?.("");
    };
  }, [captionAriaLabel, onStatusChange]);

  const scoredKeepDiscards = useMemo(
    () =>
      [...scoredKeepDiscardsByNetScore].sort(
        compareByExpectedScoreThenRankDescending(scoreSortKey),
      ),
    [scoredKeepDiscardsByNetScore, scoreSortKey],
  );
  const scoredKeepDiscardsWithTiers = useScoredKeepDiscardRows({
    chosenClassification,
    cribRole,
    cribUncertainty: sidecars.crib,
    dealtCards,
    isChosenWithinNoise: withinNoiseThreshold !== null,
    playUncertainty: sidecars.play,
    scoredKeepDiscards,
    scoredKeepDiscardsByNetScore,
  });
  const handleScoreSortClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onScoreSortKeyChange(
        event.currentTarget.value as ScoredKeepDiscardSortKey,
      );
    },
    [onScoreSortKeyChange],
  );

  if (loadError) {
    return (
      <div className={classes.error}>
        <span>Failed to load analysis.</span>
        <button
          className={classes.retryButton}
          onClick={handleRetry}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!tables) {
    return <div className={classes.loading}>Loading analysis...</div>;
  }
  const renderHandHeader = () => (
    <th aria-label="Kept hand and discard">
      <span className={`${classes.headerStack} ${classes.headerStackStart}`}>
        <span className={classes.headerMain}>Keep (Discard)</span>
      </span>
    </th>
  );

  const renderScoringTableHeader = (
    header: ReturnType<typeof getScoringHeaders>[number],
  ) => (
    <th
      aria-sort={scoreSortKey === header.key ? "descending" : "none"}
      key={header.key}
      title={header.title}
    >
      <button
        aria-label={`${header.label}: ${header.title}`}
        className={classes.headerButton}
        onClick={handleScoreSortClick}
        type="button"
        value={header.key}
      >
        <span className={classes.headerMain}>{header.label}</span>
        <span
          aria-hidden="true"
          className={classes.headerUnit}
        >
          pts
        </span>
      </button>
    </th>
  );

  const renderScoringTableHead = () => (
    <thead>
      <tr>
        {renderHandHeader()}
        {getScoringHeaders().map(renderScoringTableHeader)}
      </tr>
    </thead>
  );

  const renderCaption = () => {
    if (captionAriaLabel === null) {
      return null;
    }
    return (
      <figcaption
        aria-label={captionAriaLabel}
        className={classes.diagnosticCaption}
        role="group"
      >
        {chosenClassification === null ? (
          <span className={classes.optimalBadge}>{optimalMargin.label}</span>
        ) : (
          <>
            {withinNoiseThreshold === null ? (
              <span className={classes.subOptimalBadge}>
                Sub-optimal: {renderRoleLossPairText(rolePair)}
              </span>
            ) : (
              <span className={classes.noiseBadge}>
                Within noise: {renderRoleLossPairText(rolePair)}
              </span>
            )}
            <span className={classes.diagnosticReason}>
              {chosenClassification.gainPart === null ? (
                <span className={classes.diagnosticSide}>
                  {chosenClassification.lossPart}
                </span>
              ) : (
                <>
                  <span className={classes.diagnosticSide}>
                    {chosenClassification.gainPart}
                  </span>{" "}
                  <span className={classes.diagnosticSide}>
                    {chosenClassification.comparisonOperator}{" "}
                    {chosenClassification.lossPart}
                  </span>
                </>
              )}
            </span>
          </>
        )}
      </figcaption>
    );
  };

  const renderScoringTableBody = () => (
    <tbody>
      {scoredKeepDiscardsWithTiers.map(
        ({
          cribUncertainty: cribBound,
          descriptionId,
          highlightTier,
          playUncertainty: playStandardError,
          rowIndex,
          scoredKeepDiscard,
        }) => (
          <ScoredPossibleKeepDiscard
            classification={
              highlightTier === "chosen" ? chosenClassification : null
            }
            cribRole={cribRole}
            cribUncertainty={cribBound}
            descriptionId={descriptionId}
            highlightTier={highlightTier}
            isWithinNoise={
              highlightTier === "chosen" && withinNoiseThreshold !== null
            }
            key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
              .map((dealtCard) => dealtCard.dealOrder)
              .join("")}
            playUncertainty={playStandardError}
            rowIndex={rowIndex}
            scoredKeepDiscard={scoredKeepDiscard}
            sortOrder={sortOrder}
          />
        ),
      )}
    </tbody>
  );

  const renderDescriptions = () => (
    <div className={classes.visuallyHiddenDescriptions}>
      {scoredKeepDiscardsWithTiers.map(({ descriptionId, rowTitle }) =>
        descriptionId && rowTitle ? (
          <span
            id={descriptionId}
            key={descriptionId}
          >
            {rowTitle}
          </span>
        ) : null,
      )}
    </div>
  );

  return (
    <figure
      className={`${classes.scoredPossibleKeepDiscards} ${
        isPracticeDrill ? classes.inDrill : ""
      }`}
    >
      {renderCaption()}
      <div className={classes.tableContainer}>
        <table>
          <colgroup>
            <col className={classes.handColumn} />
            {getScoringHeaders().map((header) => (
              <col
                className={scoreColumnClass(header.key)}
                key={header.key}
              />
            ))}
          </colgroup>
          {renderScoringTableHead()}
          {renderScoringTableBody()}
        </table>
        {renderDescriptions()}
      </div>
    </figure>
  );
}

ScoredPossibleKeepDiscards.defaultProps = {
  cribUncertaintySource: shippedCribUncertainty,
  isPracticeDrill: false,
  loadCribTable: cribLoader.loadTable,
  loadPlayTable: playLoader.loadTable,
  onStatusChange: null,
  playUncertaintySource: shippedPlayUncertainty,
};
