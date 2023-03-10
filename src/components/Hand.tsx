import { Card } from "./Card";
import { DealtCard } from "../DealtCard";
import React from "react";

export interface HandProps {
  dealtCards: DealtCard[];
  setDealtCards: (dealtCards: DealtCard[]) => void;
}

export function Hand({ dealtCards, setDealtCards }: HandProps) {
  return (
    <ul className="hand">
      {dealtCards.map((dealtCard, index) => (
        <Card
          dealOrderIndex={index}
          dealtCards={dealtCards}
          key={dealtCard.dealOrder}
          setDealtCards={setDealtCards}
        />
      ))}
    </ul>
  );
}
