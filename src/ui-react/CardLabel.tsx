import * as classes from "./CardLabel.module.css";
import { CARD_LABELS, Rank, Suit } from "../game/Card";
import { getTenClass } from "./getTenClass";

export interface CardLabelProps {
  readonly rank: Rank;
  readonly suit?: Suit | undefined;
}

export function CardLabel({ rank, suit }: CardLabelProps) {
  const isRed = suit === Suit.HEARTS || suit === Suit.DIAMONDS;
  const suitClass = isRed ? classes.redSuit : classes.blackSuit;

  return (
    <div
      className={[classes.cardLabel, getTenClass(rank, classes.ten), suitClass]
        .filter(Boolean)
        .join(" ")
        .trim()}
    >
      {
        // eslint-disable-next-line security/detect-object-injection
        CARD_LABELS[rank]
      }
      {suit}
    </div>
  );
}

CardLabel.defaultProps = {
  // eslint-disable-next-line no-undefined
  suit: undefined,
};
