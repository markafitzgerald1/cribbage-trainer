import * as classes from "./Hand.module.css";
import { HandCard } from "./HandCard";
import type { HandProps } from "./HandProps";
import { sortCards } from "../ui/sortCards";

export function Hand({
  dealtCards,
  locked = false,
  sortOrder,
  onChange,
}: HandProps) {
  const handId = dealtCards
    .map((card) => `${card.rank}:${card.suit}`)
    .join("-");

  return (
    <figure className={classes.figure}>
      <figcaption className={classes.figcaption}>Hand</figcaption>
      {locked ? null : (
        <p className={classes.cue}>Select two cards to discard</p>
      )}
      <ul className={classes.hand}>
        {sortCards(dealtCards, sortOrder).map((dealtCard) => (
          <HandCard
            dealOrderIndex={dealtCard.dealOrder}
            disabled={locked}
            kept={dealtCard.kept}
            key={`${handId}:${dealtCard.dealOrder}`}
            onChange={onChange}
            rank={dealtCard.rank}
            suit={dealtCard.suit}
          />
        ))}
      </ul>
    </figure>
  );
}

Hand.defaultProps = {
  locked: false,
};
