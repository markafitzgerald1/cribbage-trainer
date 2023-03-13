import { Card } from "./Card";
import { DealtCardsHook } from "./DealtCardsHook";
import React from "react";

export function Hand({ dealtCards, setDealtCards }: DealtCardsHook) {
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
