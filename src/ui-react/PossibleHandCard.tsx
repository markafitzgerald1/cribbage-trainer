import * as classes from "./PossibleHandCard.module.css";
import { Rank, Suit } from "../game/Card";
import { CardLabel } from "./CardLabel";

interface PossibleHandCardProps {
  readonly rank: Rank;
  readonly suit?: Suit | undefined;
}

export function PossibleHandCard({ rank, suit }: PossibleHandCardProps) {
  return (
    <span className={`${classes.card}`}>
      <CardLabel
        cornerIndex
        rank={rank}
        suit={suit}
      />
    </span>
  );
}

PossibleHandCard.defaultProps = {
  // eslint-disable-next-line no-undefined
  suit: undefined,
};
