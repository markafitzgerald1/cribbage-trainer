import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import {
  type CribUncertaintySource,
  shippedCribUncertainty,
} from "../game/cribUncertaintyLoader";
import {
  type DiscardHighlightTier,
  ScoredPossibleKeepDiscard,
  getRowTitle,
} from "./ScoredPossibleKeepDiscard";
import {
  type MistakeClassification,
  classifyScoredMistake,
} from "../analysis/classifyMistake";
import { type MouseEvent, useCallback, useEffect, useMemo } from "react";
import {
  type OptimalDiscardMargin,
  computeOptimalDiscardMargin,
  isEqualBestCandidate,
} from "../analysis/optimalDiscard";
import {
  type RoleLossPairLabel,
  oppositeRoleExpectedPointsLoss,
  roleLossPairLabel,
} from "../analysis/oppositeRoleLoss";
import {
  type ScoredKeepDiscard,
  allScoredKeepDiscardsByExpectedNetScoreDescending,
} from "../analysis/analysis";
import {
  ScoredKeepDiscardSortKey,
  compareByExpectedScoreThenRankDescending,
} from "../analysis/compareByExpectedScoreDescending";
import type { DealtCard } from "../game/DealtCard";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import { type ExpectedTables } from "./expectedTables";
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { SortOrder } from "../ui/SortOrder";
import { cribUncertaintyBound } from "../analysis/cribUncertaintyBound";
import { getDiscardQuality } from "../analysis/discardQuality";
import { renderRoleLossPairText } from "./RoleLossPairText";
import { useCribUncertainty } from "./useCribUncertainty";
import { useExpectedTables } from "./useExpectedTables";

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
   * Where the published uncertainty sidecar is read from, deferred until the
   * means are on screen. An absent or rejected sidecar leaves the means-only
   * recommendation exactly as it is. Injectable as one object so a caller's
   * source is the only thing the table can show; pass a stable one, since it
   * is an effect dependency.
   */
  readonly cribUncertaintySource?: CribUncertaintySource;
  readonly loadPlayTable?: () => Promise<ExpectedPlayPointsTable>;

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

  /** Discard verdict and narrative notification; null clears the status. */
  readonly onStatusChange?: ((statusText: string) => void) | null;
  readonly scoreSortKey: ScoredKeepDiscardSortKey;
  readonly sortOrder: SortOrder;
}

const getHighlightTier = (
  isChosen: boolean,
  isEqualBest: boolean,
): DiscardHighlightTier => {
  if (isChosen) {
    return "chosen";
  }
  if (isEqualBest) {
    return "equal-best";
  }
  return "none";
};

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

interface ChosenDiagnosticInfo {
  readonly captionAriaLabel: string | null;
  readonly chosenClassification: MistakeClassification | null;
  readonly optimalMargin: OptimalDiscardMargin;
  // Null until a discard is complete and the tables have loaded; never zero to stand in for unknown.
  readonly oppositeRoleLoss: number | null;
  readonly rolePair: RoleLossPairLabel;
}

interface ChosenDiagnosticInput {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];
  readonly scoredOptions: readonly ScoredKeepDiscard<DealtCard>[];
  readonly tables: ExpectedTables | null;
}

const useChosenDiagnosticInfo = ({
  cribRole,
  dealtCards,
  scoredOptions,
  tables,
}: ChosenDiagnosticInput): ChosenDiagnosticInfo =>
  useMemo(() => {
    const chosen =
      scoredOptions.find((option) =>
        option.discard.every((card) => !card.kept),
      ) ?? null;
    const [best] = scoredOptions;
    const chosenClassification =
      best && chosen ? classifyScoredMistake(best, chosen) : null;
    /*
     * The discarded cards come from `dealtCards` rather than from the
     * matched option, so no second narrowing against null is needed: the
     * two cards not kept are the discard, by definition. Computed for
     * every completed decision rather than only for mistakes, because the
     * figure is evidence either way — a discard that was best for the role
     * held and costly for the other one says as much as the reverse.
     */
    const oppositeRoleLoss =
      tables === null || chosen === null
        ? null
        : oppositeRoleExpectedPointsLoss({
            cards: dealtCards,
            chosenDiscardCards: dealtCards.filter((card) => !card.kept),
            cribRole,
            tables,
          });
    const optimalMargin = computeOptimalDiscardMargin(scoredOptions);
    const rolePair = roleLossPairLabel(
      cribRole,
      chosenClassification?.netLoss ?? 0,
      oppositeRoleLoss,
    );
    let captionAriaLabel: string | null = null;
    if (chosen !== null) {
      captionAriaLabel =
        chosenClassification === null
          ? optimalMargin.accessibleLabel
          : `Sub-optimal: ${rolePair.accessibleLabel}. ${chosenClassification.accessibleLabel}`;
    }

    return {
      captionAriaLabel,
      chosenClassification,
      oppositeRoleLoss,
      optimalMargin,
      rolePair,
    };
  }, [cribRole, dealtCards, scoredOptions, tables]);

export function ScoredPossibleKeepDiscards({
  cribRole,
  dealtCards,
  isPracticeDrill = false,
  cribUncertaintySource = shippedCribUncertainty,
  loadCribTable = cribLoader.loadTable,
  loadPlayTable = playLoader.loadTable,
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
  const uncertainty = useCribUncertainty(
    tables !== null,
    cribUncertaintySource,
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
    rolePair,
  } = useChosenDiagnosticInfo({
    cribRole,
    dealtCards,
    scoredOptions: scoredKeepDiscardsByNetScore,
    tables,
  });
  const renderedAnalysis = useMemo(
    (): RenderedAnalysis => ({
      cribRole,
      oppositeRoleExpectedPointsLoss: oppositeRoleLoss,
      quality: getDiscardQuality(scoredKeepDiscardsByNetScore),
    }),
    [cribRole, oppositeRoleLoss, scoredKeepDiscardsByNetScore],
  );
  useEffect(() => {
    // The scored options are a dependency because Back and Forward swap the hand while this component stays mounted.
    if (tables !== null) {
      onAnalysisRendered(renderedAnalysis);
      if (captionAriaLabel !== null) {
        onStatusChange?.(captionAriaLabel);
      }
    }
    return () => {
      onStatusChange?.("");
    };
  }, [
    captionAriaLabel,
    onAnalysisRendered,
    onStatusChange,
    renderedAnalysis,
    tables,
  ]);

  const scoredKeepDiscards = useMemo(
    () =>
      [...scoredKeepDiscardsByNetScore].sort(
        compareByExpectedScoreThenRankDescending(scoreSortKey),
      ),
    [scoredKeepDiscardsByNetScore, scoreSortKey],
  );
  const scoredKeepDiscardsWithTiers = useMemo(() => {
    const bestNet = scoredKeepDiscardsByNetScore[0]?.expectedNetPoints ?? 0;

    return scoredKeepDiscards.map((scoredKeepDiscard, index) => {
      const isChosen = scoredKeepDiscard.keep.every((card) => card.kept);
      const isEqualBest =
        !isChosen &&
        isEqualBestCandidate(bestNet, scoredKeepDiscard.expectedNetPoints);
      const highlightTier = getHighlightTier(isChosen, isEqualBest);
      const rowTitle = getRowTitle(
        highlightTier,
        isChosen ? chosenClassification : null,
      );
      const descriptionId = rowTitle
        ? `scored-discard-${index}-description`
        : null;

      return {
        cribUncertainty:
          uncertainty === null
            ? null
            : cribUncertaintyBound({
                cribStarterPoints: scoredKeepDiscard.cribStarterPoints,
                discard: scoredKeepDiscard.discard,
                knownCards: dealtCards,
                role: cribRole,
                uncertainty,
              }),
        descriptionId,
        highlightTier,
        rowIndex: index,
        rowTitle,
        scoredKeepDiscard,
      };
    });
  }, [
    chosenClassification,
    cribRole,
    dealtCards,
    scoredKeepDiscards,
    scoredKeepDiscardsByNetScore,
    uncertainty,
  ]);
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
      >
        {chosenClassification === null ? (
          <span className={classes.optimalBadge}>{optimalMargin.label}</span>
        ) : (
          <>
            <span className={classes.subOptimalBadge}>
              Sub-optimal: {renderRoleLossPairText(rolePair)}
            </span>
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
          cribUncertainty,
          descriptionId,
          highlightTier,
          rowIndex,
          scoredKeepDiscard,
        }) => (
          <ScoredPossibleKeepDiscard
            classification={
              highlightTier === "chosen" ? chosenClassification : null
            }
            cribRole={cribRole}
            cribUncertainty={cribUncertainty}
            descriptionId={descriptionId}
            highlightTier={highlightTier}
            key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
              .map((dealtCard) => dealtCard.dealOrder)
              .join("")}
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
};
