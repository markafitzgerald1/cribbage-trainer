import * as classes from "./CutResultRow.module.css";
import { type Card, type Rank } from "../game/Card";
import { CardLabel } from "./CardLabel";
import { SortOrder } from "../ui/SortOrder";

interface CutResultRowProps {
  readonly cuts: readonly (Rank | Card)[];
  readonly sortOrder: SortOrder;
  readonly fifteensPoints: number;
  readonly pairsPoints: number;
  readonly runsPoints: number;
  readonly flushesPoints: number;
  readonly nobsPoints: number;
  readonly totalPoints: number;
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
  const sortedCuts = [...cuts].sort((first, second) => {
    const firstRank = typeof first === "number" ? first : first.rank;
    const secondRank = typeof second === "number" ? second : second.rank;
    if (firstRank !== secondRank) {
      return sortOrder === SortOrder.Ascending
        ? firstRank - secondRank
        : secondRank - firstRank;
    }
    // If ranks are same, one might be a card and one a rank (shouldn't happen with my grouping)
    // Or both cards with different suits.
    if (typeof first !== "number" && typeof second !== "number") {
      return first.suit.localeCompare(second.suit);
    }
    return 0;
  });

  return (
    <div className={classes.cutResultRow}>
      <div className={classes.cutsColumn}>
        {sortedCuts.map((item) => {
          if (typeof item === "number") {
            return (
              <CardLabel
                key={item}
                rank={item}
              />
            );
          }
          return (
            <CardLabel
              key={`${item.rank}-${item.suit}`}
              rank={item.rank}
              suit={item.suit}
            />
          );
        })}
      </div>
      <div className={classes.pointsColumn}>{nobsPoints || 0}</div>
      <div className={classes.pointsColumn}>{fifteensPoints || 0}</div>
      <div className={classes.totalColumn}>{totalPoints}</div>
      <div className={classes.pointsColumn}>{pairsPoints || 0}</div>
      <div className={classes.pointsColumn}>{runsPoints || 0}</div>
      <div className={classes.pointsColumn}>{flushesPoints || 0}</div>
    </div>
  );
}
