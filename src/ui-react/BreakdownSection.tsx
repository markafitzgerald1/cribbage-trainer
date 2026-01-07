/* eslint react/jsx-max-depth: ["error", { "max": 3 }] */
import * as classes from "./BreakdownSection.module.css";
import { CardLabel } from "./CardLabel";
import type { CutContribution } from "../game/expectedCutAddedPoints";
import type { Rank } from "../game/Card";

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

interface GroupedContribution {
  readonly points: number;
  readonly ranks: readonly Rank[];
  readonly totalCount: number;
}

function groupContributionsByPoints(
  contributions: readonly CutContribution[],
): GroupedContribution[] {
  const pointsMap = new Map<number, { ranks: Rank[]; totalCount: number }>();

  for (const contribution of contributions) {
    const existing = pointsMap.get(contribution.points);
    if (existing) {
      existing.ranks.push(contribution.cutCard.rank);
      existing.totalCount += contribution.count;
    } else {
      pointsMap.set(contribution.points, {
        ranks: [contribution.cutCard.rank],
        totalCount: contribution.count,
      });
    }
  }

  return Array.from(pointsMap.entries())
    .map(([points, { ranks, totalCount }]) => ({
      points,
      ranks,
      totalCount,
    }))
    .sort((first, second) => second.points - first.points);
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
  const groupedContributions = groupContributionsByPoints(contributions);

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
      {groupedContributions.length > 0 && (
        <div className={classes.contributionDetails}>
          {groupedContributions.map((group) => (
            <span
              className={classes.contributionItem}
              key={group.ranks.join("")}
            >
              {group.ranks.map((rank) => (
                <CardLabel
                  key={rank}
                  rank={rank}
                />
              ))}
              <span className={classes.contributionCount}>
                ×{group.totalCount}
              </span>
              <span className={classes.contributionPoints}>
                +{group.points}pts
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
