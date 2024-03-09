import * as classes from "./CardLabel.module.css";
import { CARD_LABELS, Rank } from "../game/Card";
import { getTenClass } from "./getTenClass";

export interface CardLabelProps {
  readonly rank: Rank;
}

export function CardLabel({ rank }: CardLabelProps) {
  return (
    <div
      className={[classes.cardLabel, getTenClass(rank, classes.ten)]
        .join(" ")
        .trim()}
    >
      {
        // eslint-disable-next-line security/detect-object-injection
        CARD_LABELS[rank]
      }
    </div>
  );
}
