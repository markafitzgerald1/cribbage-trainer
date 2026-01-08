import * as classes from "./CutResultRow.module.css";

export function PointsCell({ points }: { readonly points: number }) {
  return (
    <div className={classes.pointsColumn}>
      {points > 0 ? points : <span className={classes.muted}>—</span>}
    </div>
  );
}
