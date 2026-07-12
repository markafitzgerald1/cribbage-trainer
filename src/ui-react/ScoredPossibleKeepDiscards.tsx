import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ScoredKeepDiscardSortKey,
  compareByExpectedScoreThenRankDescending,
} from "../analysis/compareByExpectedScoreDescending";
import type { DealtCard } from "../game/DealtCard";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByExpectedNetScoreDescending } from "../analysis/analysis";

export interface ScoredPossibleKeepDiscardsProps {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];

  /**
   * Loads the crib EV table. Injectable so stories and tests can exercise the
   * load-failure path without module mocking; defaults to the shared loader.
   */
  readonly loadCribTable?: () => Promise<ExpectedCribPointsTable>;
  readonly loadPlayTable?: () => Promise<ExpectedPlayPointsTable>;
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

export function ScoredPossibleKeepDiscards({
  cribRole,
  dealtCards,
  loadCribTable = cribLoader.loadTable,
  loadPlayTable = playLoader.loadTable,
  onScoreSortKeyChange,
  scoreSortKey,
  sortOrder,
}: ScoredPossibleKeepDiscardsProps) {
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

  const renderScoringTableBody = () => (
    <tbody>
      {scoredKeepDiscards.map((scoredKeepDiscard, index) => (
        <ScoredPossibleKeepDiscard
          cribRole={cribRole}
          isHighlighted={scoredKeepDiscard.keep.every((card) => card.kept)}
          key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
            .map((dealtCard) => dealtCard.dealOrder)
            .join("")}
          rowIndex={index}
          scoredKeepDiscard={scoredKeepDiscard}
          sortOrder={sortOrder}
        />
      ))}
    </tbody>
  );

  return (
    <figure className={classes.scoredPossibleKeepDiscards}>
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
