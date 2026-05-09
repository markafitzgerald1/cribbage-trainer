import * as classes from "./CardLabel.module.css";
import { CARD_LABELS, Rank, Suit } from "../game/Card";
import { getTenClass } from "./getTenClass";

export interface CardLabelProps {
  readonly isHandCard?: boolean;
  readonly rank: Rank;
  readonly suit?: Suit | undefined;
}

export function CardLabel({ isHandCard, rank, suit }: CardLabelProps) {
  const isRed = suit === Suit.HEARTS || suit === Suit.DIAMONDS;
  const suitClass = isRed ? classes.redSuit : classes.blackSuit;
  const suitColorClass = isRed ? "red-suit" : "black-suit";

  return (
    <div
      className={[
        classes.cardLabel,
        getTenClass(rank, classes.ten),
        suitClass,
        suitColorClass,
        !suit && classes.rankOnly,
        isHandCard && classes.handCardLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()}
    >
      <span className={classes.rank}>
        {
          // eslint-disable-next-line security/detect-object-injection
          CARD_LABELS[rank]
        }
      </span>
      {suit ? <span className={classes.suit}>{suit}</span> : null}
    </div>
  );
}

CardLabel.defaultProps = {
  isHandCard: false,
  // eslint-disable-next-line no-undefined
  suit: undefined,
};
