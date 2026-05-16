import * as classes from "./HandCard.module.css";
import { Rank, Suit } from "../game/Card";
import { CardLabel } from "./CardLabel";
import { useCallback } from "react";

export interface CardProps {
  readonly dealOrderIndex: number;
  readonly kept: boolean;
  readonly onChange: (dealOrderIndex: number) => void;
  readonly rank: Rank;
  readonly suit?: Suit | undefined;
}

export function HandCard({
  dealOrderIndex,
  onChange,
  kept,
  rank,
  suit,
}: CardProps) {
  const handleChange = useCallback(() => {
    onChange(dealOrderIndex);
  }, [dealOrderIndex, onChange]);

  return (
    <label
      className={`${classes.handCard}${kept ? "" : ` ${classes.discarded}`}`}
    >
      <CardLabel
        isHandCard
        rank={rank}
        suit={suit}
      />
      {}
      <input
        checked={kept}
        onChange={handleChange}
        type="checkbox"
      />
    </label>
  );
}

HandCard.defaultProps = {
  // eslint-disable-next-line no-undefined
  suit: undefined,
};
