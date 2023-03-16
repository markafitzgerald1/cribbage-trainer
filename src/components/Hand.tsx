import { Card } from "./Card";
import { DealtCardsHook } from "./DealtCardsHook";
import React from "react";
import { SortOrder } from "../SortOrder";
import { compare } from "../sortCards";

interface HandProps extends DealtCardsHook {
  sortOrder: SortOrder;
}

export function Hand({ dealtCards, setDealtCards, sortOrder }: HandProps) {
  const sortedDealtCards = [...dealtCards].sort(compare[SortOrder[sortOrder]]);
  return (
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
  );
}
