import * as classes from "./CutResultRow.module.css";
import { CardLabel } from "./CardLabel";
import { PointsCell } from "./PointsCell";
import type { Rank } from "../game/Card";
import { SortOrder } from "../ui/SortOrder";

const MINIMUM_CUT_COUNT_TO_SHOW_MULTIPLIER = 2;

interface CutResultRowProps {
  readonly cuts: readonly Rank[];
  readonly cutCount: number;
  readonly fifteensPoints: number;
  readonly pairsPoints: number;
  readonly runsPoints: number;
  readonly sortOrder: SortOrder;
  readonly totalPoints: number;
}

export function CutResultRow({
  cuts,
  cutCount,
  fifteensPoints,
  pairsPoints,
  runsPoints,
  sortOrder,
  totalPoints,
}: CutResultRowProps) {
  const sortedCuts =
    sortOrder === SortOrder.Ascending
      ? [...cuts].sort((first, second) => first - second)
      : [...cuts].sort((first, second) => second - first);

  return (
    <div className={classes.cutResultRow}>
      <div className={classes.cutsColumn}>
        {sortedCuts.map((rank) => (
          <CardLabel
            key={rank}
            rank={rank}
          />
        ))}
        <span className={classes.cutCount}>
          {cutCount >= MINIMUM_CUT_COUNT_TO_SHOW_MULTIPLIER && `×${cutCount}`}
        </span>
      </div>
      <PointsCell points={fifteensPoints} />
      <PointsCell points={pairsPoints} />
      <PointsCell points={runsPoints} />
      <div className={classes.totalColumn}>{totalPoints}</div>
    </div>
  );
}
