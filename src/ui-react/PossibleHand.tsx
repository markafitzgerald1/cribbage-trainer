import * as classes from "./PossibleHand.module.css";
import { CalculationsProps } from "./Calculations";
import { PossibleHandCard } from "./PossibleHandCard";
import React from "react";
import { sortCards } from "../ui/sortCards";

export function PossibleHand({ dealtCards, sortOrder }: CalculationsProps) {
  return (
    <span className={classes.keepDiscard}>
      {sortCards(dealtCards, sortOrder).map((dealtCard) => (
        <PossibleHandCard
          dealtCard={dealtCard}
          key={dealtCard.dealOrder}
        />
      ))}
    </span>
  );
}
