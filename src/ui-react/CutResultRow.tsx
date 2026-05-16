import * as classes from "./CutResultRow.module.css";
import { type Rank, type Suit } from "../game/Card";
import { CardLabel } from "./CardLabel";
import { type GroupedCut } from "./groupCutsByResults";
import { SortOrder } from "../ui/SortOrder";

interface CutResultRowProps {
  readonly cuts: readonly GroupedCut[];
  readonly sortOrder: SortOrder;
  readonly fifteensPoints: number;
  readonly pairsPoints: number;
  readonly runsPoints: number;
  readonly flushesPoints: number;
  readonly nobsPoints: number;
  readonly totalPoints: number;
}

interface VisualGroup {
  readonly ranks: Rank[];
  readonly suits: readonly Suit[];
  readonly isAllRemaining: boolean;
  readonly key: string;
}

export function CutResultRow({
  cuts,
  sortOrder,
  fifteensPoints,
  pairsPoints,
  runsPoints,
  flushesPoints,
  nobsPoints,
  totalPoints,
}: CutResultRowProps) {
  const renderPoints = (points: number) =>
    points === 0 ? <span className={classes.muted}>—</span> : points;

  const sortedCuts = [...cuts].sort((first, second) => {
    if (first.rank !== second.rank) {
      return sortOrder === SortOrder.Ascending
        ? first.rank - second.rank
        : second.rank - first.rank;
    }
    return 0;
  });

  const groupsBySuitKey = new Map<string, VisualGroup>();
  for (const cut of sortedCuts) {
    const suitKey = cut.isAllRemaining
      ? "all"
      : [...cut.suits].sort().join(",");
    const existing = groupsBySuitKey.get(suitKey);

    if (existing) {
      existing.ranks.push(cut.rank);
    } else {
      groupsBySuitKey.set(suitKey, {
        isAllRemaining: cut.isAllRemaining,
        key: suitKey,
        ranks: [cut.rank],
        suits: cut.isAllRemaining ? [] : cut.suits,
      });
    }
  }
  const visualGroups = Array.from(groupsBySuitKey.values());

  const renderGroup = (group: VisualGroup) => (
    <span
      className={`${classes.genericCut} generic-cut`}
      key={group.key + group.ranks.join("-")}
    >
      <CardLabel
        ranks={group.ranks}
        suits={group.suits}
      />
    </span>
  );

  return (
    <div className={classes.cutResultRow}>
      <div className={`${classes.cutsColumn} cut-cards-column`}>
        {visualGroups.map((group) => renderGroup(group))}
      </div>
      {[
        { label: "fifteens", points: fifteensPoints },
        { label: "pairs", points: pairsPoints },
        { label: "runs", points: runsPoints },
        { label: "flushes", points: flushesPoints },
        { label: "nobs", points: nobsPoints },
      ].map((cat) => (
        <div
          className={`${classes.pointsColumn} points-column`}
          key={cat.label}
        >
          {renderPoints(cat.points)}
        </div>
      ))}
      <div className={`${classes.totalColumn} total-column`}>
        {renderPoints(totalPoints)}
      </div>
    </div>
  );
}
