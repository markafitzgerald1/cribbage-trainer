import * as classes from "./CutResultRow.module.css";
import { CardLabel } from "./CardLabel";
import type { Rank } from "../game/Card";

const MINIMUM_CUT_COUNT_TO_SHOW_MULTIPLIER = 2;

interface CutResultRowProps {
  readonly cuts: readonly Rank[];
  readonly cutCount: number;
  readonly fifteensPoints: number;
  readonly pairsPoints: number;
  readonly runsPoints: number;
  readonly totalPoints: number;
}

export function CutResultRow({
  cuts,
  cutCount,
  fifteensPoints,
  pairsPoints,
  runsPoints,
  totalPoints,
}: CutResultRowProps) {
  return (
    <div className={classes.cutResultRow}>
      <div className={classes.cutsColumn}>
        {cuts.map((rank) => (
          <CardLabel
            key={rank}
            rank={rank}
          />
        ))}
        <span className={classes.cutCount}>
          {cutCount >= MINIMUM_CUT_COUNT_TO_SHOW_MULTIPLIER && `×${cutCount}`}
        </span>
      </div>
      <div className={classes.pointsColumn}>
        {fifteensPoints > 0 ? fifteensPoints : "—"}
      </div>
      <div className={classes.pointsColumn}>
        {pairsPoints > 0 ? pairsPoints : "—"}
      </div>
      <div className={classes.pointsColumn}>
        {runsPoints > 0 ? runsPoints : "—"}
      </div>
      <div className={classes.totalColumn}>{totalPoints}</div>
    </div>
  );
}
