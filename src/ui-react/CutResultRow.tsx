import * as classes from "./CutResultRow.module.css";
import { CardLabel } from "./CardLabel";
import { PointsCell } from "./PointsCell";
import type { Rank } from "../game/Card";
import { SortOrder } from "../ui/SortOrder";

interface CutResultRowProps {
  readonly cuts: readonly Rank[];
  readonly fifteensPoints: number;
  readonly pairsPoints: number;
  readonly runsPoints: number;
  readonly flushesPoints: number;
  readonly nobsPoints: number;
  readonly sortOrder: SortOrder;
  readonly totalPoints: number;
}

export function CutResultRow({
  cuts,
  fifteensPoints,
  pairsPoints,
  runsPoints,
  flushesPoints,
  nobsPoints,
  sortOrder,
  totalPoints,
}: CutResultRowProps) {
  const sortedCuts =
    sortOrder === SortOrder.Ascending
      ? [...cuts].sort((first, second) => first - second)
      : [...cuts].sort((first, second) => second - first);

  const categories = [
    { label: "15s", points: fifteensPoints },
    { label: "Pairs", points: pairsPoints },
    { label: "Runs", points: runsPoints },
    { label: "Flushes", points: flushesPoints },
    { label: "Nobs", points: nobsPoints },
  ];

  return (
    <div className={classes.cutResultRow}>
      <div className={classes.cutsColumn}>
        {sortedCuts.map((rank) => (
          <CardLabel
            key={rank}
            rank={rank}
          />
        ))}
      </div>
      {categories.map((category) => (
        <PointsCell
          key={category.label}
          points={category.points}
        />
      ))}
      <div className={classes.totalColumn}>{totalPoints}</div>
    </div>
  );
}
