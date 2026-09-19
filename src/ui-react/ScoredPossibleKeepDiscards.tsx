import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import {
  type DiscardHighlightTier,
  ScoredPossibleKeepDiscard,
  getRowTitle,
} from "./ScoredPossibleKeepDiscard";
import {
  type MistakeClassification,
  classifyScoredMistake,
} from "../analysis/classifyMistake";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type OptimalDiscardMargin,
  computeOptimalDiscardMargin,
  isEqualBestCandidate,
} from "../analysis/optimalDiscard";
import {
  type ScoredKeepDiscard,
  allScoredKeepDiscardsByExpectedNetScoreDescending,
} from "../analysis/analysis";
import {
  ScoredKeepDiscardSortKey,
  compareByExpectedScoreThenRankDescending,
} from "../analysis/compareByExpectedScoreDescending";
import {
  oppositeRoleExpectedPointsLoss,
  roleLossPairLabel,
} from "../analysis/oppositeRoleLoss";
import type { DealtCard } from "../game/DealtCard";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { SortOrder } from "../ui/SortOrder";
import { getDiscardQuality } from "../analysis/discardQuality";

export interface ScoredPossibleKeepDiscardsProps {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];
  readonly isPracticeDrill?: boolean;

  /**
   * Loads the crib EV table. Injectable so stories and tests can exercise the
   * load-failure path without module mocking; defaults to the shared loader.
   */
  readonly loadCribTable?: () => Promise<ExpectedCribPointsTable>;
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

const scoreColumns = [
  {
    className: classes.scoreColumn,
    key: ScoredKeepDiscardSortKey.ExpectedHandPoints,
  },
  {
    className: classes.scoreColumn,
    key: ScoredKeepDiscardSortKey.ExpectedCribPoints,
  },
  {
    className: classes.playScoreColumn,
    key: ScoredKeepDiscardSortKey.ExpectedPlayPoints,
  },
  {
    className: classes.netScoreColumn,
    key: ScoredKeepDiscardSortKey.ExpectedNetPoints,
  },
] as const;

interface ExpectedTables {
  readonly crib: ExpectedCribPointsTable;
  readonly play: ExpectedPlayPointsTable;
}

interface ChosenDiagnosticInfo {
  readonly chosenClassification: MistakeClassification | null;
  readonly hasChosenCandidate: boolean;
  readonly optimalMargin: OptimalDiscardMargin;
  // Null until a discard is complete and the tables have loaded; never zero to stand in for unknown.
  readonly oppositeRoleLoss: number | null;
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

    return {
      chosenClassification:
        best && chosen ? classifyScoredMistake(best, chosen) : null,
      hasChosenCandidate: chosen !== null,
      /*
       * The discarded cards come from `dealtCards` rather than from the
       * matched option, so no second narrowing against null is needed: the
       * two cards not kept are the discard, by definition. Computed for
       * every completed decision rather than only for mistakes, because the
       * figure is evidence either way — a discard that was best for the role
       * held and costly for the other one says as much as the reverse.
       */
      oppositeRoleLoss:
        tables === null || chosen === null
          ? null
          : oppositeRoleExpectedPointsLoss({
              cards: dealtCards,
              chosenDiscardCards: dealtCards.filter((card) => !card.kept),
              cribRole,
              tables,
            }),
      optimalMargin: computeOptimalDiscardMargin(scoredOptions),
    };
  }, [cribRole, dealtCards, scoredOptions, tables]);

interface ExpectedTablesState {
  readonly handleRetry: () => void;
  readonly loadError: boolean;
  readonly tables: ExpectedTables | null;
}

const useExpectedTables = (
  loadCribTable: () => Promise<ExpectedCribPointsTable>,
  loadPlayTable: () => Promise<ExpectedPlayPointsTable>,
): ExpectedTablesState => {
  const [tables, setTables] = useState<ExpectedTables | null>(() => {
    const crib = cribLoader.getTableSync();
    const play = playLoader.getTableSync();
    return crib && play ? { crib, play } : null;
  });
  const [loadError, setLoadError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    if (!tables && !loadError) {
      Promise.all([loadCribTable(), loadPlayTable()])
        .then(([crib, play]) => {
          setTables({ crib, play });
        })
        .catch(() => {
          setLoadError(true);
        });
    }
  }, [loadCribTable, loadError, loadPlayTable, retryCount, tables]);

  const handleRetry = useCallback(() => {
    setLoadError(false);
    setRetryCount((prev) => prev + 1);
  }, []);

  return { handleRetry, loadError, tables };
};

export function ScoredPossibleKeepDiscards({
  cribRole,
  dealtCards,
  isPracticeDrill = false,
  loadCribTable = cribLoader.loadTable,
  loadPlayTable = playLoader.loadTable,
  onAnalysisRendered,
  onScoreSortKeyChange,
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
    chosenClassification,
    hasChosenCandidate,
    oppositeRoleLoss,
    optimalMargin,
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
  const resultsAreOnScreen = tables !== null;
  useEffect(() => {
    // The scored options are a dependency because Back and Forward swap the hand while this component stays mounted.
    if (resultsAreOnScreen) {
      onAnalysisRendered(renderedAnalysis);
    }
  }, [onAnalysisRendered, renderedAnalysis, resultsAreOnScreen]);

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
        descriptionId,
        highlightTier,
        rowIndex: index,
        rowTitle,
        scoredKeepDiscard,
      };
    });
  }, [chosenClassification, scoredKeepDiscards, scoredKeepDiscardsByNetScore]);
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
    if (!hasChosenCandidate) {
      return null;
    }
    /*
     * Both role costs live in the one badge rather than in a chip of their
     * own. A third chip on this row starts a third row on a portrait phone
     * at a large device font, which the #802 caption-height guard in
     * practiceDrill.spec.ts fails; folding the pair into the badge that
     * already carried one of the two numbers keeps the row count and drops
     * the duplication.
     */
    const rolePair = roleLossPairLabel(
      cribRole,
      chosenClassification?.netLoss ?? 0,
      oppositeRoleLoss,
    );
    const captionAriaLabel =
      chosenClassification === null
        ? optimalMargin.accessibleLabel
        : `Sub-optimal: ${rolePair.accessibleLabel}. ${chosenClassification.accessibleLabel}`;
    return (
      <figcaption
        aria-label={captionAriaLabel}
        className={classes.diagnosticCaption}
        role="status"
      >
        {chosenClassification === null ? (
          <span className={classes.optimalBadge}>{optimalMargin.label}</span>
        ) : (
          <>
            <span className={classes.subOptimalBadge}>
              Sub-optimal: {rolePair.label}
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
        ({ descriptionId, highlightTier, rowIndex, scoredKeepDiscard }) => (
          <ScoredPossibleKeepDiscard
            classification={
              highlightTier === "chosen" ? chosenClassification : null
            }
            cribRole={cribRole}
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
            {scoreColumns.map((column) => (
              <col
                className={column.className}
                key={column.key}
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
  isPracticeDrill: false,
  loadCribTable: cribLoader.loadTable,
  loadPlayTable: playLoader.loadTable,
};
