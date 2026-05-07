import * as classes from "./CardLabel.module.css";
import { CARDS, CARD_LABELS, Rank, Suit } from "../game/Card";
import { getTenClass } from "./getTenClass";

export interface CardLabelProps {
  readonly rank: Rank;
  readonly suit?: Suit | undefined;
}

export function CardLabel({ rank, suit }: CardLabelProps) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, security/detect-object-injection
  const displaySuit = suit ?? CARDS[rank]!.suit;
  const isRed = displaySuit === Suit.HEARTS || displaySuit === Suit.DIAMONDS;
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
      {displaySuit}
    </div>
  );
}

CardLabel.defaultProps = {
  // eslint-disable-next-line no-undefined
  suit: undefined,
};
