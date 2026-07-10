import * as classes from "./CardGridPicker.module.css";
import {
  CARD_RANKS,
  type Card,
  Suit,
  createCard,
  isSamePhysicalCard,
} from "../game/Card";
import { CardLabel } from "./CardLabel";
import { useCallback } from "react";

const CARD_GRID_SUIT_ORDER = [
  Suit.SPADES,
  Suit.HEARTS,
  Suit.DIAMONDS,
  Suit.CLUBS,
] as const;

const CARD_GRID_CARDS = CARD_GRID_SUIT_ORDER.flatMap((suit) =>
  CARD_RANKS.map((rank) => createCard(rank, suit)),
);

export interface CardGridPickerProps {
  readonly onToggle: (card: Card) => void;
  readonly selectedCards: readonly Card[];
  readonly selectionFull: boolean;
}

export function CardGridPicker({
  onToggle,
  selectedCards,
  selectionFull,
}: CardGridPickerProps) {
  const handleToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const cardIndex = Number(event.currentTarget.value);
      if (event.detail > 0) {
        event.currentTarget.blur();
      }
      // Buttons are generated directly from CARD_GRID_CARDS with matching indices.
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
      onToggle(CARD_GRID_CARDS[cardIndex]!);
    },
    [onToggle],
  );

  return (
    <div
      aria-label="Card choices"
      className={classes.grid}
      role="group"
    >
      {CARD_GRID_CARDS.map((card, cardIndex) => {
        const isSelected = selectedCards.some((selectedCard) =>
          isSamePhysicalCard(selectedCard, card),
        );
        return (
          <button
            aria-label={`${card.rankLabel}${card.suit}`}
            aria-pressed={isSelected}
            className={classes.card}
            disabled={selectionFull ? !isSelected : false}
            key={`${card.rank}-${card.suit}`}
            onClick={handleToggle}
            type="button"
            value={cardIndex}
          >
            <CardLabel
              rank={card.rank}
              suit={card.suit}
            />
          </button>
        );
      })}
    </div>
  );
}
