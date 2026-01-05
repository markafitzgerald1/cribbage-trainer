/* eslint react/jsx-max-depth: ["error", { "max": 7 }] */
import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByExpectedScoreDescending } from "../analysis/analysis";
import { Fragment, useState } from "react";

export interface ScoredPossibleKeepDiscardsProps {
  readonly dealtCards: readonly DealtCard[];
  readonly sortOrder: SortOrder;
}

const EXPECTED_POINTS_FRACTION_DIGITS = 2;

export function ScoredPossibleKeepDiscards({
  dealtCards,
  sortOrder,
}: ScoredPossibleKeepDiscardsProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
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
              (scoredKeepDiscard) => {
                const rowKey = [
                  ...scoredKeepDiscard.keep,
                  ...scoredKeepDiscard.discard,
                ]
                  .map((dealtCard) => dealtCard.dealOrder)
                  .join("");
                const isExpanded = rowKey === expandedKey;
                const toggleExpanded = () => {
                  setExpandedKey((currentKey) =>
                    currentKey === rowKey ? null : rowKey,
                  );
                };

                return (
                  <Fragment key={rowKey}>
                    <ScoredPossibleKeepDiscard
                      discard={scoredKeepDiscard.discard}
                      expectedHandPoints={scoredKeepDiscard.expectedHandPoints}
                      handPoints={scoredKeepDiscard.handPoints}
                      isExpanded={isExpanded}
                      isHighlighted={scoredKeepDiscard.keep.every(
                        (card) => card.kept,
                      )}
                      keep={scoredKeepDiscard.keep}
                      onToggleExpand={toggleExpanded}
                      sortOrder={sortOrder}
                    />
                    {isExpanded ? (
                      <tr
                        className={classes.cutBreakdownRow}
                        onClick={toggleExpanded}
                      >
                        <td colSpan={scoringHeaders.length + 1}>
                          <div className={classes.cutBreakdown}>
                            <span className={classes.cutBreakdownLabel}>
                              Cut breakdown:
                            </span>
                            <span className={classes.cutBreakdownItem}>
                              15s{" "}
                              <strong>
                                {scoredKeepDiscard.expectedCutAddedFifteens.toFixed(
                                  EXPECTED_POINTS_FRACTION_DIGITS,
                                )}
                              </strong>
                            </span>
                            <span className={classes.cutBreakdownItem}>
                              pairs{" "}
                              <strong>
                                {scoredKeepDiscard.expectedCutAddedPairs.toFixed(
                                  EXPECTED_POINTS_FRACTION_DIGITS,
                                )}
                              </strong>
                            </span>
                            <span className={classes.cutBreakdownItem}>
                              runs{" "}
                              <strong>
                                {scoredKeepDiscard.expectedCutAddedRuns.toFixed(
                                  EXPECTED_POINTS_FRACTION_DIGITS,
                                )}
                              </strong>
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              },
            )}
          </tbody>
        </table>
      </div>
      <div className={classes.legend}>
        Hand: Points in hand. Cut: Expected additional. Total: Expected total.
        Click a row to show the cut breakdown (15s, pairs, runs).
      </div>
    </figure>
  );
}
