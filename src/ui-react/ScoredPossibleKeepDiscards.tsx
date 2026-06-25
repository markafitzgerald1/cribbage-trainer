import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import * as loader from "../game/expectedCribPointsTableLoader";
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
  readonly loadTable?: () => Promise<ExpectedCribPointsTable>;
  readonly sortOrder: SortOrder;
}

const getScoringHeaders = (cribRole: CribRole) =>
  [
    {
      key: ScoredKeepDiscardSortKey.ExpectedHandPoints,
      label: "E(h)",
      title: "Sort by expected hand points",
    },
    {
      key: ScoredKeepDiscardSortKey.ExpectedCribPoints,
      label: "E(c)",
      title: "Sort by signed expected crib points",
    },
    {
      key: ScoredKeepDiscardSortKey.ExpectedNetPoints,
      label: cribRole === CribRole.Dealer ? "E(h+c)" : "E(h-c)",
      title: "Sort by expected hand points plus signed crib points",
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
    className: classes.netScoreColumn,
    key: ScoredKeepDiscardSortKey.ExpectedNetPoints,
  },
] as const;

export function ScoredPossibleKeepDiscards({
  cribRole,
  dealtCards,
  loadTable = loader.loadTable,
  sortOrder,
}: ScoredPossibleKeepDiscardsProps) {
  const [table, setTable] = useState<ExpectedCribPointsTable | null>(
    loader.getTableSync(),
  );
  const [loadError, setLoadError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    if (!table && !loadError) {
      loadTable()
        .then(setTable)
        .catch(() => {
          setLoadError(true);
        });
    }
  }, [loadError, loadTable, table, retryCount]);

  const handleRetry = useCallback(() => {
    setLoadError(false);
    setRetryCount((prev) => prev + 1);
  }, []);

  const [scoreSortKey, setScoreSortKey] = useState<ScoredKeepDiscardSortKey>(
    ScoredKeepDiscardSortKey.ExpectedNetPoints,
  );
  const scoredKeepDiscardsByNetScore = useMemo(
    () =>
      table
        ? allScoredKeepDiscardsByExpectedNetScoreDescending(
            dealtCards,
            cribRole,
            table,
          )
        : [],
    [cribRole, dealtCards, table],
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
      setScoreSortKey(event.currentTarget.value as ScoredKeepDiscardSortKey);
    },
    [],
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

  if (!table) {
    return <div className={classes.loading}>Loading analysis...</div>;
  }
  const renderHandHeader = () => (
    <th aria-label="Hand composition">
      <span className={`${classes.headerStack} ${classes.headerStackStart}`}>
        <span className={classes.headerMain}>Hand</span>
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
        {getScoringHeaders(cribRole).map(renderScoringTableHeader)}
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
  loadTable: loader.loadTable,
};
