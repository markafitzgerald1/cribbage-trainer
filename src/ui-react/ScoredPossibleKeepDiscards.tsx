/* eslint react/jsx-max-depth: ["error", { "max": 7 }] */
import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByExpectedScoreDescending } from "../analysis/analysis";

export interface ScoredPossibleKeepDiscardsProps {
  readonly dealtCards: readonly DealtCard[];
  readonly sortOrder: SortOrder;
}

export function ScoredPossibleKeepDiscards({
  dealtCards,
  sortOrder,
}: ScoredPossibleKeepDiscardsProps) {
  const scoringHeaders = [
    {
      key: "hand",
      label: "Hand",
      title: "Points in hand before the cut",
    },
    {
      key: "cut",
      label: "Cut",
      title: "Expected additional points from the cut",
    },
    {
      key: "avg15s",
      label: "E[+15s]",
      title: "Average cut-added 15s: Expected additional fifteens points from the cut",
    },
    {
      key: "avgPairs",
      label: "E[+pairs]",
      title: "Average cut-added pairs: Expected additional pair points from the cut",
    },
    {
      key: "avgRuns",
      label: "E[+runs]",
      title: "Average cut-added runs: Expected additional run points from the cut",
    },
    {
      key: "total",
      label: "Total",
      title: "Total expected hand points",
    },
  ] as const;

  return (
    <figure className={classes.scoredPossibleKeepDiscards}>
      <div className={classes.tableContainer}>
        <table>
          <thead>
            <tr>
              <th aria-label="Hand composition">
                <span
                  className={`${classes.headerStack} ${classes.headerStackStart}`}
                >
                  <span className={classes.headerMain}>Hand</span>
                </span>
              </th>
              {scoringHeaders.map((header) => (
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
              ))}
            </tr>
          </thead>
          <tbody>
            {allScoredKeepDiscardsByExpectedScoreDescending(dealtCards).map(
              (scoredKeepDiscard) => (
                <ScoredPossibleKeepDiscard
                  avgCutAdded15s={scoredKeepDiscard.avgCutAdded15s}
                  avgCutAddedPairs={scoredKeepDiscard.avgCutAddedPairs}
                  avgCutAddedRuns={scoredKeepDiscard.avgCutAddedRuns}
                  discard={scoredKeepDiscard.discard}
                  expectedHandPoints={scoredKeepDiscard.expectedHandPoints}
                  handPoints={scoredKeepDiscard.handPoints}
                  isHighlighted={scoredKeepDiscard.keep.every(
                    (card) => card.kept,
                  )}
                  keep={scoredKeepDiscard.keep}
                  key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
                    .map((dealtCard) => dealtCard.dealOrder)
                    .join("")}
                  sortOrder={sortOrder}
                />
              ),
            )}
          </tbody>
        </table>
      </div>
      <div className={classes.legend}>
        Hand: Points in hand. Cut: Expected additional. E[+15s], E[+pairs],
        E[+runs]: Average cut-added points by category. Total: Expected total.
      </div>
    </figure>
  );
}
