import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import type { ComparableCard } from "../ui/sortCards";
import { PossibleHand } from "./PossibleHand";
import { SortOrder } from "../ui/SortOrder";
import { useState } from "react";
import type { CutContribution } from "../game/expectedCutAddedPoints";
import { CardLabel } from "./CardLabel";

interface ScoredPossibleKeepDiscardProps {
  readonly keep: readonly ComparableCard[];
  readonly discard: readonly ComparableCard[];
  readonly handPoints: number;
  readonly expectedHandPoints: number;
  readonly avgCutAdded15s: number;
  readonly avgCutAddedPairs: number;
  readonly avgCutAddedRuns: number;
  readonly fifteensContributions: CutContribution[];
  readonly pairsContributions: CutContribution[];
  readonly runsContributions: CutContribution[];
  readonly sortOrder: SortOrder;
  readonly isHighlighted: boolean;
}

const EXPECTED_POINTS_FRACTION_DIGITS = 2;
const TOTAL_POSSIBLE_CUTS = 46; // 52 cards - 6 dealt cards

interface CategoryStats {
  totalCuts: number;
  totalPoints: number;
}

function calculateCategoryStats(
  contributions: CutContribution[],
): CategoryStats {
  let totalCuts = 0;
  let totalPoints = 0;

  for (const contrib of contributions) {
    totalCuts += contrib.count;
    totalPoints += contrib.count * contrib.points;
  }

  return { totalCuts, totalPoints };
}

export function ScoredPossibleKeepDiscard({
  keep,
  discard,
  handPoints,
  expectedHandPoints,
  avgCutAdded15s,
  avgCutAddedPairs,
  avgCutAddedRuns,
  fifteensContributions,
  pairsContributions,
  runsContributions,
  sortOrder,
  isHighlighted,
}: ScoredPossibleKeepDiscardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRowClick = () => {
    setIsExpanded(!isExpanded);
  };

  const fifteensStats = calculateCategoryStats(fifteensContributions);
  const pairsStats = calculateCategoryStats(pairsContributions);
  const runsStats = calculateCategoryStats(runsContributions);

  return (
    <>
      <tr
        className={`${classes.scoredPossibleKeepDiscard} ${
          isHighlighted ? classes.highlighted : ""
        } ${classes.clickable}`}
        onClick={handleRowClick}
      >
        <td>
          <PossibleHand
            dealtCards={keep}
            sortOrder={sortOrder}
          />{" "}
          (
          <PossibleHand
            dealtCards={discard}
            sortOrder={sortOrder}
          />
          )
        </td>
        <td>{handPoints}</td>
        <td>
          {(expectedHandPoints - handPoints).toFixed(
            EXPECTED_POINTS_FRACTION_DIGITS,
          )}
        </td>
        <td>{expectedHandPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}</td>
      </tr>
      {isExpanded && (
        <tr
          className={classes.expandedRow}
          onClick={handleRowClick}
        >
          <td colSpan={4}>
            <div className={classes.breakdownContainer}>
              <div className={classes.breakdownSection}>
                <div className={classes.breakdownItem}>
                  <span className={classes.breakdownLabel}>
                    Expected cut-added 15s:
                  </span>
                  <span className={classes.breakdownValue}>
                    {avgCutAdded15s.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}{" "}
                    pts
                    {fifteensStats.totalCuts > 0 && (
                      <span
                        style={{
                          fontWeight: "normal",
                          fontSize: "0.9em",
                          opacity: 0.8,
                          marginLeft: "4px",
                        }}
                      >
                        {" "}
                        ({fifteensStats.totalCuts} cuts, {fifteensStats.totalPoints}{" "}
                        pts = {fifteensStats.totalPoints}/{TOTAL_POSSIBLE_CUTS})
                      </span>
                    )}
                  </span>
                </div>
                {fifteensContributions.length > 0 && (
                  <div className={classes.contributionDetails}>
                    {fifteensContributions.map((contrib, idx) => (
                      <span
                        className={classes.contributionItem}
                        key={idx}
                      >
                        <CardLabel rank={contrib.cutCard.rank} />
                        <span className={classes.contributionCount}>
                          ×{contrib.count}
                        </span>
                        <span className={classes.contributionPoints}>
                          +{contrib.points}pts
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className={classes.breakdownSection}>
                <div className={classes.breakdownItem}>
                  <span className={classes.breakdownLabel}>
                    Expected cut-added pairs:
                  </span>
                  <span className={classes.breakdownValue}>
                    {avgCutAddedPairs.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}{" "}
                    pts
                    {pairsStats.totalCuts > 0 && (
                      <span
                        style={{
                          fontWeight: "normal",
                          fontSize: "0.9em",
                          opacity: 0.8,
                          marginLeft: "4px",
                        }}
                      >
                        {" "}
                        ({pairsStats.totalCuts} cuts, {pairsStats.totalPoints}{" "}
                        pts = {pairsStats.totalPoints}/{TOTAL_POSSIBLE_CUTS})
                      </span>
                    )}
                  </span>
                </div>
                {pairsContributions.length > 0 && (
                  <div className={classes.contributionDetails}>
                    {pairsContributions.map((contrib, idx) => (
                      <span
                        className={classes.contributionItem}
                        key={idx}
                      >
                        <CardLabel rank={contrib.cutCard.rank} />
                        <span className={classes.contributionCount}>
                          ×{contrib.count}
                        </span>
                        <span className={classes.contributionPoints}>
                          +{contrib.points}pts
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className={classes.breakdownSection}>
                <div className={classes.breakdownItem}>
                  <span className={classes.breakdownLabel}>
                    Expected cut-added runs:
                  </span>
                  <span className={classes.breakdownValue}>
                    {avgCutAddedRuns.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}{" "}
                    pts
                    {runsStats.totalCuts > 0 && (
                      <span
                        style={{
                          fontWeight: "normal",
                          fontSize: "0.9em",
                          opacity: 0.8,
                          marginLeft: "4px",
                        }}
                      >
                        {" "}
                        ({runsStats.totalCuts} cuts, {runsStats.totalPoints}{" "}
                        pts = {runsStats.totalPoints}/{TOTAL_POSSIBLE_CUTS})
                      </span>
                    )}
                  </span>
                </div>
                {runsContributions.length > 0 && (
                  <div className={classes.contributionDetails}>
                    {runsContributions.map((contrib, idx) => (
                      <span
                        className={classes.contributionItem}
                        key={idx}
                      >
                        <CardLabel rank={contrib.cutCard.rank} />
                        <span className={classes.contributionCount}>
                          ×{contrib.count}
                        </span>
                        <span className={classes.contributionPoints}>
                          +{contrib.points}pts
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
