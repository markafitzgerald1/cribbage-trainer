import { Card } from "./Card";
import { DealtCard } from "../DealtCard";
import React from "react";

export type HandProps = {
  dealtCards: DealtCard[];
  toggleKept: (index: number) => void;
};

export function Hand({ dealtCards, toggleKept }: HandProps) {
  return (
    <ul className="hand">
      {dealtCards.map((dealtCard, index) => (
        <Card
          dealOrderIndex={index}
          dealtCard={dealtCard}
          key={dealtCard.index}
          toggleKept={toggleKept}
        />
      ))}
    </ul>
  );
}
