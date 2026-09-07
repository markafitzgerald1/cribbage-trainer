import * as classes from "./HandCard.module.css";
import { Rank, Suit } from "../game/Card";
import { CardLabel } from "./CardLabel";
import { useCallback } from "react";

export interface CardProps {
  readonly dealOrderIndex: number;
  // Locks the checkbox once a drill choice is checked, so the frozen selection reads as non-editable to pointer and screen-reader users rather than silently ignoring input.
  readonly disabled?: boolean;
  readonly kept: boolean;
  readonly onChange: (dealOrderIndex: number) => void;
  readonly rank: Rank;
  readonly suit?: Suit | undefined;
}

export function HandCard({
  dealOrderIndex,
  disabled = false,
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
      className={`${classes.handCard}${kept ? "" : ` ${classes.discarded}`}${
        disabled ? ` ${classes.locked}` : ""
      }`}
    >
      <CardLabel
        isHandCard
        rank={rank}
        suit={suit}
      />
      {}
      <input
        checked={kept}
        disabled={disabled}
        onChange={handleChange}
        type="checkbox"
      />
    </label>
  );
}

HandCard.defaultProps = {
  disabled: false,
  // eslint-disable-next-line no-undefined
  suit: undefined,
};
