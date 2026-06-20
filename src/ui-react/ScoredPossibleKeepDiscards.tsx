import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import { type MouseEvent, useCallback, useMemo, useState } from "react";
import {
  ScoredKeepDiscardSortKey,
  compareByExpectedScoreThenRankDescending,
} from "../analysis/compareByExpectedScoreDescending";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByExpectedNetScoreDescending } from "../analysis/analysis";

export interface ScoredPossibleKeepDiscardsProps {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];
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
  sortOrder,
}: ScoredPossibleKeepDiscardsProps) {
  const [scoreSortKey, setScoreSortKey] = useState<ScoredKeepDiscardSortKey>(
    ScoredKeepDiscardSortKey.ExpectedNetPoints,
  );
  const scoredKeepDiscardsByNetScore = useMemo(
    () =>
      allScoredKeepDiscardsByExpectedNetScoreDescending(dealtCards, cribRole),
    [cribRole, dealtCards],
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
          avgCutAdded15s={scoredKeepDiscard.avgCutAdded15s}
          avgCutAddedFlushes={scoredKeepDiscard.avgCutAddedFlushes}
          avgCutAddedNobs={scoredKeepDiscard.avgCutAddedNobs}
          avgCutAddedPairs={scoredKeepDiscard.avgCutAddedPairs}
          avgCutAddedRuns={scoredKeepDiscard.avgCutAddedRuns}
          cribStarterPoints={scoredKeepDiscard.cribStarterPoints}
          cutCountsRemaining={scoredKeepDiscard.cutCountsRemaining}
          discard={scoredKeepDiscard.discard}
          expectedCribPointBreakdown={
            scoredKeepDiscard.expectedCribPointBreakdown
          }
          expectedCribPoints={scoredKeepDiscard.expectedCribPoints}
          expectedHandPoints={scoredKeepDiscard.expectedHandPoints}
          expectedNetPoints={scoredKeepDiscard.expectedNetPoints}
          fifteensContributions={scoredKeepDiscard.fifteensContributions}
          flushesContributions={scoredKeepDiscard.flushesContributions}
          handPointsBreakdown={scoredKeepDiscard.handPointsBreakdown}
          isHighlighted={scoredKeepDiscard.keep.every((card) => card.kept)}
          keep={scoredKeepDiscard.keep}
          key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
            .map((dealtCard) => dealtCard.dealOrder)
            .join("")}
          nobsContributions={scoredKeepDiscard.nobsContributions}
          pairsContributions={scoredKeepDiscard.pairsContributions}
          rowIndex={index}
          runsContributions={scoredKeepDiscard.runsContributions}
          signedExpectedCribPoints={scoredKeepDiscard.signedExpectedCribPoints}
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
