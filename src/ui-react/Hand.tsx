import * as classes from "./Hand.module.css";
import { HandCard } from "./HandCard";
import { HandProps } from "./HandProps";
import React from "react";
import { sortCards } from "../ui/sortCards";

export function Hand({ dealtCards, sortOrder, onChange }: HandProps) {
  const sortedDealtCards = sortCards(dealtCards, sortOrder);
  return (
    <figure className={classes.figure}>
      <figcaption className={classes.figcaption}>Dealt hand:</figcaption>
      <ul className={classes.hand}>
        {sortedDealtCards.map((dealtCard) => (
          <HandCard
            dealOrderIndex={dealtCard.dealOrder}
            kept={dealtCard.kept}
            key={dealtCard.dealOrder}
            onChange={onChange}
            rank={dealtCard.rank}
          />
        ))}
      </ul>
    </figure>
  );
}
