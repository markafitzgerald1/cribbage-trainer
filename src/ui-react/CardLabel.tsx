import * as classes from "./CardLabel.module.css";
import { CARD_LABELS, Rank, Suit } from "../game/Card";
import { getTenClass } from "./getTenClass";

const CLUBS_SVG_PATH =
  "M50 4c-14 0-25 11-25 25 0 7 3 13 8 17-5-4-12-6-19-6C6 40 0 50 0 61c0 14 10 24 24 24 9 0 16-5 20-13 0 9-5 17-16 22v4h44v-4c-11-5-16-13-16-22 4 8 11 13 20 13 14 0 24-10 24-24 0-11-6-21-14-21-7 0-14 2-19 6 5-4 8-10 8-17C75 15 64 4 50 4Z";
const DIAMONDS_SVG_PATH = "M50 4 94 50 50 96 6 50 50 4Z";
const HEARTS_SVG_PATH =
  "M50 91 12 54C4 46 1 38 3 29 5 16 15 8 28 8c9 0 17 5 22 13 5-8 13-13 22-13 13 0 23 8 25 21 2 9-1 17-9 25L50 91Z";
const SPADES_SVG_PATH =
  "M50 5 12 42C4 50 1 58 3 67c2 13 12 21 25 21 8 0 15-4 19-10-1 7-5 12-11 16v4h28v-4c-6-4-10-9-11-16 4 6 11 10 19 10 13 0 23-8 25-21 2-9-1-17-9-25L50 5Z";

export interface CardLabelProps {
  readonly isHandCard?: boolean;
  readonly rank: Rank;
  readonly suit?: Suit | undefined;
}

function renderSuitIcon(suit: Suit) {
  const renderIcon = (pathData: string) => (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
    >
      <path d={pathData} />
    </svg>
  );

  switch (suit) {
    case Suit.CLUBS:
      return renderIcon(CLUBS_SVG_PATH);
    case Suit.DIAMONDS:
      return renderIcon(DIAMONDS_SVG_PATH);
    case Suit.HEARTS:
      return renderIcon(HEARTS_SVG_PATH);
    case Suit.SPADES:
      return renderIcon(SPADES_SVG_PATH);
    default:
      throw new Error(`Unknown suit: ${String(suit)}`);
  }
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
      {suit ? (
        <>
          <span className={classes.suit}>{renderSuitIcon(suit)}</span>
          <span className={classes.suitText}>{suit}</span>
        </>
      ) : null}
    </div>
  );
}

CardLabel.defaultProps = {
  isHandCard: false,
  // eslint-disable-next-line no-undefined
  suit: undefined,
};
