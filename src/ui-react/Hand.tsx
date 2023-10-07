import * as classes from "./Hand.module.css";
import { Card } from "./Card";
import { HandProps } from "./HandProps";
import React from "react";
import { sortCards } from "../ui/sortCards";

export function Hand({ dealtCards, setDealtCards, sortOrder }: HandProps) {
  const sortedDealtCards = sortCards(dealtCards, sortOrder);
  return (
    <figure className={classes.figure}>
      <figcaption className={classes.figcaption}>Dealt hand:</figcaption>
      <ul className={classes.hand}>
        {sortedDealtCards.map((dealtCard, index) => (
          <Card
            dealOrderIndex={index}
            dealtCards={sortedDealtCards}
            key={dealtCard.dealOrder}
            setDealtCards={setDealtCards}
          />
        ))}
      </ul>
    </figure>
  );
}
