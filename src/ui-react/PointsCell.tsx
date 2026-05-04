import * as classes from "./PointsCell.module.css";

export function PointsCell({ points }: { readonly points: number }) {
  return (
    <div className={classes.pointsCell}>
      {points > 0 ? points : <span className={classes.muted}>—</span>}
    </div>
  );
}
