import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByExpectedScoreDescending } from "../analysis/analysis";

export interface ScoredPossibleKeepDiscardsProps {
  readonly dealtCards: readonly DealtCard[];
  readonly sortOrder: SortOrder;
}

const scoringHeaders = [
  {
    key: "hand",
    label: "Hand",
    title: "Points in hand before the cut",
  },
  {
    key: "15s",
    label: "15s",
    title: "Expected additional points from 15s",
  },
  {
    key: "pairs",
    label: "Pairs",
    title: "Expected additional points from pairs",
  },
  {
    key: "runs",
    label: "Runs",
    title: "Expected additional points from runs",
  },
  {
    key: "flushes",
    label: "Flushes",
    title: "Expected additional points from flushes",
  },
  {
    key: "nobs",
    label: "Nobs",
    title: "Expected additional points from nobs",
  },
  {
    key: "total",
    label: "Total",
    title: "Total expected hand points",
  },
] as const;

export function ScoredPossibleKeepDiscards({
  dealtCards,
  sortOrder,
}: ScoredPossibleKeepDiscardsProps) {
  const renderHandHeader = () => (
    <th aria-label="Hand composition">
      <span className={`${classes.headerStack} ${classes.headerStackStart}`}>
        <span className={classes.headerMain}>Hand</span>
      </span>
    </th>
  );

  const renderScoringTableHeader = (
    header: (typeof scoringHeaders)[number],
  ) => (
    <th
      key={header.key}
      title={header.title}
    >
      <span className={classes.headerStack}>
        <span className={classes.headerMain}>{header.label}</span>
        <span
          aria-hidden="true"
          className={classes.headerUnit}
        >
          pts
        </span>
      </span>
    </th>
  );

  const renderScoringTableHead = () => (
    <thead>
      <tr>
        {renderHandHeader()}
        {scoringHeaders.map(renderScoringTableHeader)}
      </tr>
    </thead>
  );

  const renderScoringTableBody = () => (
    <tbody>
      {allScoredKeepDiscardsByExpectedScoreDescending(dealtCards).map(
        (scoredKeepDiscard, index) => (
          <ScoredPossibleKeepDiscard
            avgCutAdded15s={scoredKeepDiscard.avgCutAdded15s}
            avgCutAddedFlushes={scoredKeepDiscard.avgCutAddedFlushes}
            avgCutAddedNobs={scoredKeepDiscard.avgCutAddedNobs}
            avgCutAddedPairs={scoredKeepDiscard.avgCutAddedPairs}
            avgCutAddedRuns={scoredKeepDiscard.avgCutAddedRuns}
            cutCountsRemaining={scoredKeepDiscard.cutCountsRemaining}
            discard={scoredKeepDiscard.discard}
            expectedHandPoints={scoredKeepDiscard.expectedHandPoints}
            fifteensContributions={scoredKeepDiscard.fifteensContributions}
            flushesContributions={scoredKeepDiscard.flushesContributions}
            handPoints={scoredKeepDiscard.handPoints}
            isHighlighted={scoredKeepDiscard.keep.every((card) => card.kept)}
            keep={scoredKeepDiscard.keep}
            key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
              .map((dealtCard) => dealtCard.dealOrder)
              .join("")}
            nobsContributions={scoredKeepDiscard.nobsContributions}
            pairsContributions={scoredKeepDiscard.pairsContributions}
            rowIndex={index}
            runsContributions={scoredKeepDiscard.runsContributions}
            sortOrder={sortOrder}
          />
        ),
      )}
    </tbody>
  );

  return (
    <figure className={classes.scoredPossibleKeepDiscards}>
      <div className={classes.tableContainer}>
        <table>
          {renderScoringTableHead()}
          {renderScoringTableBody()}
        </table>
      </div>
    </figure>
  );
}
