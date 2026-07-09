import * as classes from "./CardGridPicker.module.css";
import { type Card, DECK, isSamePhysicalCard } from "../game/Card";
import { CardLabel } from "./CardLabel";
import { useCallback } from "react";

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
      // Buttons are generated directly from DECK with matching indices.
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
      onToggle(DECK[cardIndex]!);
    },
    [onToggle],
  );

  return (
    <div
      aria-label="Card choices"
      className={classes.grid}
      role="group"
    >
      {DECK.map((card, cardIndex) => {
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
