import * as classes from "./PossibleHandCard.module.css";
import { CardLabel } from "./CardLabel";
import { Rank } from "../game/Card";

interface PossibleHandCardProps {
  readonly rank: Rank;
}

export function PossibleHandCard({ rank }: PossibleHandCardProps) {
  return (
    <span className={`${classes.card}`}>
      <CardLabel rank={rank} />
    </span>
  );
}
