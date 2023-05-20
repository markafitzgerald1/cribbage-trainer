import { Card } from "./Card";
import { DealtCardsHook } from "./DealtCardsHook";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { sortCards } from "../ui/sortCards";

interface HandProps extends DealtCardsHook {
  sortOrder: SortOrder;
}

export function Hand({ dealtCards, setDealtCards, sortOrder }: HandProps) {
  const sortedDealtCards = sortCards(dealtCards, sortOrder);
  return (
    <figure>
      <figcaption>Dealt hand:</figcaption>
      <ul className="hand">
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
