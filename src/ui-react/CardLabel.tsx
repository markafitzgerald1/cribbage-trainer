import { CARD_LABELS, Rank, Suit } from "../game/Card";
import { getTenClass } from "./getTenClass";
import * as classes from "./CardLabel.module.css";

const CLUBS_SVG_PATH =
  "M50 4c-14 0-25 11-25 25 0 7 3 13 8 17-5-4-12-6-19-6C6 40 0 50 0 61c0 14 10 24 24 24 9 0 16-5 20-13 0 9-5 17-16 22v4h44v-4c-11-5-16-13-16-22 4 8 11 13 20 13 14 0 24-10 24-24 0-11-6-21-14-21-7 0-14 2-19 6 5-4 8-10 8-17C75 15 64 4 50 4Z";
const DIAMONDS_SVG_PATH = "M50 4 94 50 50 96 6 50 50 4Z";
const HEARTS_SVG_PATH =
  "M50 91 12 54C4 46 1 38 3 29 5 16 15 8 28 8c9 0 17 5 22 13 5-8 13-13 22-13 13 0 23 8 25 21 2 9-1 17-9 25L50 91Z";
const SPADES_SVG_PATH =
  "M50 5 12 42C4 50 1 58 3 67c2 13 12 21 25 21 8 0 15-4 19-10-1 7-5 12-11 16v4h28v-4c-6-4-10-9-11-16 4 6 11 10 19 10 13 0 23-8 25-21 2-9-1-17-9-25L50 5Z";

const SUIT_ICONS: Record<Suit, JSX.Element> = {
  [Suit.CLUBS]: (
    <svg aria-hidden="true" viewBox="0 0 100 100">
      <path d={CLUBS_SVG_PATH} />
    </svg>
  ),
  [Suit.DIAMONDS]: (
    <svg aria-hidden="true" viewBox="0 0 100 100">
      <path d={DIAMONDS_SVG_PATH} />
    </svg>
  ),
  [Suit.HEARTS]: (
    <svg aria-hidden="true" viewBox="0 0 100 100">
      <path d={HEARTS_SVG_PATH} />
    </svg>
  ),
  [Suit.SPADES]: (
    <svg aria-hidden="true" viewBox="0 0 100 100">
      <path d={SPADES_SVG_PATH} />
    </svg>
  ),
};

export interface CardLabelProps {
  readonly isHandCard?: boolean;
  readonly rank?: Rank | undefined;
  readonly ranks?: readonly Rank[] | undefined;
  readonly suit?: Suit | undefined;
  readonly suits?: readonly Suit[] | undefined;
}

export function CardLabel({
  isHandCard = false,
  rank,
  ranks,
  suit,
  suits,
}: CardLabelProps) {
  const normalizedRanks = ranks ?? (typeof rank === "undefined" ? [] : [rank]);
  const normalizedSuits = suits ?? (typeof suit === "undefined" ? [] : [suit]);

  const allSuitsRed =
    normalizedSuits.length > 0 &&
    normalizedSuits.every((suitItem) => suitItem === Suit.DIAMONDS || suitItem === Suit.HEARTS);
  const allSuitsBlack =
    normalizedSuits.length > 0 &&
    normalizedSuits.every((suitItem) => suitItem === Suit.CLUBS || suitItem === Suit.SPADES);
  let colorClass = "";
  if (allSuitsRed) {
    colorClass = classes.redSuit;
  } else if (allSuitsBlack) {
    colorClass = classes.blackSuit;
  }

  return (
    <div
      className={[
        classes.cardLabel,
        colorClass,
        normalizedSuits.length === 0 && classes.rankOnly,
        isHandCard && classes.handCardLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()}
    >
      {normalizedRanks.map((rankItem, rankIndex) => (
        <span
          className={[classes.rank, getTenClass(rankItem, classes.ten)]
            .filter(Boolean)
            .join(" ")}
          key={`${rankItem}-${rankIndex}`}
        >
          {CARD_LABELS[rankItem]}
          {rankIndex < normalizedRanks.length - 1 ? " " : ""}
        </span>
      ))}
      {normalizedSuits.length > 1 && (
        <span className={classes.groupedParenthesisOpen}> (</span>
      )}
      <span
        className={[
          classes.suitsWrapper,
          normalizedSuits.length > 1 && classes.grouped,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {normalizedSuits.map((currentSuit) => {
          const isRed = currentSuit === Suit.DIAMONDS || currentSuit === Suit.HEARTS;
          const suitIcon = SUIT_ICONS[currentSuit];
          if (!suitIcon) {
            throw new Error(`Unknown suit: ${currentSuit}`);
          }
          return (
            <span
              className={[
                classes.suit,
                isRed ? classes.redSuit : classes.blackSuit,
              ].join(" ")}
              key={currentSuit}
            >
              <span className={classes.suitText}>{currentSuit}</span>
              {suitIcon}
            </span>
          );
        })}
      </span>
      {normalizedSuits.length > 1 && (
        <span className={classes.groupedParenthesisClose}>)</span>
      )}
    </div>
  );
}

CardLabel.defaultProps = {
  isHandCard: false,
};
