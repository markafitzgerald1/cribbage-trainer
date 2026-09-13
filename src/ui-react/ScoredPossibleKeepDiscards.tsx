import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import {
  type MistakeClassification,
  classifyScoredMistake,
  formatNetLoss,
} from "../analysis/classifyMistake";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { getDiscardQuality } from "../analysis/discardQuality";

export interface ScoredPossibleKeepDiscardsProps {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];

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

interface ChosenDiagnosticInfo {
  readonly chosenClassification: MistakeClassification | null;
  readonly hasChosenCandidate: boolean;
}

const useChosenDiagnosticInfo = (
  scoredOptions: readonly ScoredKeepDiscard<DealtCard>[],
): ChosenDiagnosticInfo =>
  useMemo(() => {
    const chosen =
      scoredOptions.find((option) =>
        option.discard.every((card) => !card.kept),
      ) ?? null;
    const best = scoredOptions[0] ?? null;
    const chosenClassification =
      best !== null && chosen !== null
        ? classifyScoredMistake(best, chosen)
        : null;

    return {
      chosenClassification,
      hasChosenCandidate: chosen !== null,
    };
  }, [scoredOptions]);

interface ExpectedTablesState {
  readonly handleRetry: () => void;
  readonly loadError: boolean;
  readonly tables: {
    readonly crib: ExpectedCribPointsTable;
    readonly play: ExpectedPlayPointsTable;
  } | null;
}

const useExpectedTables = (
  loadCribTable: () => Promise<ExpectedCribPointsTable>,
  loadPlayTable: () => Promise<ExpectedPlayPointsTable>,
): ExpectedTablesState => {
  const [tables, setTables] = useState<{
    readonly crib: ExpectedCribPointsTable;
    readonly play: ExpectedPlayPointsTable;
  } | null>(() => {
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
  const { chosenClassification, hasChosenCandidate } = useChosenDiagnosticInfo(
    scoredKeepDiscardsByNetScore,
  );
  const renderedAnalysis = useMemo(
    (): RenderedAnalysis => ({
      cribRole,
      quality: getDiscardQuality(scoredKeepDiscardsByNetScore),
    }),
    [cribRole, scoredKeepDiscardsByNetScore],
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
    return (
      <figcaption
        className={classes.diagnosticCaption}
        role="status"
      >
        {chosenClassification === null ? (
          <span className={classes.optimalBadge}>Optimal discard</span>
        ) : (
          <>
            <span className={classes.subOptimalBadge}>
              Sub-optimal: {formatNetLoss(chosenClassification.netLoss)} pts
              lost
            </span>
            <span className={classes.diagnosticReason}>
              {chosenClassification.label}
            </span>
          </>
        )}
      </figcaption>
    );
  };

  const renderScoringTableBody = () => (
    <tbody>
      {scoredKeepDiscards.map((scoredKeepDiscard, index) => {
        const isHighlighted = scoredKeepDiscard.keep.every((card) => card.kept);

        return (
          <ScoredPossibleKeepDiscard
            classification={isHighlighted ? chosenClassification : null}
            cribRole={cribRole}
            isHighlighted={isHighlighted}
            key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
              .map((dealtCard) => dealtCard.dealOrder)
              .join("")}
            rowIndex={index}
            scoredKeepDiscard={scoredKeepDiscard}
            sortOrder={sortOrder}
          />
        );
      })}
    </tbody>
  );

  return (
    <figure className={classes.scoredPossibleKeepDiscards}>
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
      </div>
    </figure>
  );
}

ScoredPossibleKeepDiscards.defaultProps = {
  loadCribTable: cribLoader.loadTable,
  loadPlayTable: playLoader.loadTable,
};
