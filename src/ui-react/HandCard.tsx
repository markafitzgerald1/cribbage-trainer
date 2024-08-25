import * as classes from "./HandCard.module.css";
import { CardLabel } from "./CardLabel";
import { Rank } from "../game/Card";
import { useCallback } from "react";

export interface CardProps {
  readonly dealOrderIndex: number;
  readonly kept: boolean;
  readonly onChange: (dealOrderIndex: number) => void;
  readonly rank: Rank;
}

export function HandCard({ dealOrderIndex, onChange, kept, rank }: CardProps) {
  const handleChange = useCallback(() => {
    onChange(dealOrderIndex);
  }, [dealOrderIndex, onChange]);

  return (
    <label
      className={`${classes.handCard}${kept ? "" : ` ${classes.discarded}`}`}
    >
      <CardLabel rank={rank} />
      {}
      <input
        checked={kept}
        onChange={handleChange}
        type="checkbox"
      />
    </label>
  );
}
