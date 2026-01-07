/* eslint react/jsx-max-depth: ["error", { "max": 3 }] */
import * as classes from "./BreakdownSection.module.css";
import { CardLabel } from "./CardLabel";
import type { CutContribution } from "../game/expectedCutAddedPoints";

const EXPECTED_POINTS_FRACTION_DIGITS = 2;
const TOTAL_POSSIBLE_CUTS = 46;

interface CategoryStats {
  totalCuts: number;
  totalPoints: number;
}

function calculateCategoryStats(
  contributions: CutContribution[],
): CategoryStats {
  let totalCuts = 0;
  let totalPoints = 0;

  for (const contribution of contributions) {
    totalCuts += contribution.count;
    totalPoints += contribution.count * contribution.points;
  }

  return { totalCuts, totalPoints };
}

interface BreakdownSectionProps {
  readonly label: string;
  readonly average: number;
  readonly contributions: CutContribution[];
}

export function BreakdownSection({
  label,
  average,
  contributions,
}: BreakdownSectionProps) {
  const stats = calculateCategoryStats(contributions);

  return (
    <div className={classes.breakdownSection}>
      <div className={classes.breakdownItem}>
        <span className={classes.breakdownLabel}>
          {label}
          {stats.totalCuts > 0 && (
            <span className={classes.breakdownStats}>
              ({stats.totalCuts} cuts, {stats.totalPoints} pts ={" "}
              {stats.totalPoints}/{TOTAL_POSSIBLE_CUTS})
            </span>
          )}
        </span>
        <span className={classes.breakdownValue}>
          {average.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} pts
        </span>
      </div>
      {contributions.length > 0 && (
        <div className={classes.contributionDetails}>
          {contributions.map((contribution) => (
            <span
              className={classes.contributionItem}
              key={contribution.cutCard.rank}
            >
              <CardLabel rank={contribution.cutCard.rank} />
              <span className={classes.contributionCount}>
                ×{contribution.count}
              </span>
              <span className={classes.contributionPoints}>
                +{contribution.points}pts
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
