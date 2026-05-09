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
  const renderPoints = (points: number) =>
    points === 0 ? <span className={classes.muted}>—</span> : points;

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
  const cutKeyCounts = new Map<string, number>();
  const getCutKey = (item: Rank | Card): string => {
    const baseKey =
      typeof item === "number"
        ? `rank-${item}`
        : `card-${item.rank}-${item.suit}`;
    const count = cutKeyCounts.get(baseKey) ?? 0;
    cutKeyCounts.set(baseKey, count + 1);
    return `${baseKey}-${count}`;
  };
  const renderCut = (item: Rank | Card) => {
    if (typeof item === "number") {
      return (
        <span
          className={`${classes.genericCut} generic-cut`}
          key={getCutKey(item)}
        >
          <CardLabel rank={item} />
        </span>
      );
    }

    return (
      <span
        className={`${classes.specificCut} specific-cut`}
        key={getCutKey(item)}
      >
        <CardLabel
          rank={item.rank}
          suit={item.suit}
        />
      </span>
    );
  };

  return (
    <div className={classes.cutResultRow}>
      <div className={`${classes.cutsColumn} cut-cards-column`}>
        {sortedCuts.map((item) => renderCut(item))}
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
