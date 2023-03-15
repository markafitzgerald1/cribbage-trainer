import { Card } from "./Card";
import { DealtCardsHook } from "./DealtCardsHook";
import React from "react";
import { SortOrder } from "../SortOrder";

interface HandProps extends DealtCardsHook {
  sortOrder: SortOrder;
}

export function Hand({ dealtCards, setDealtCards, sortOrder }: HandProps) {
  const sortedDealtCards = [...dealtCards].sort((first, second) => {
    switch (sortOrder) {
      case SortOrder.DealOrder:
        return first.dealOrder - second.dealOrder;
      case SortOrder.Ascending:
        return first.rankValue - second.rankValue;
      case SortOrder.Descending:
      default:
        return second.rankValue - first.rankValue;
    }
  });
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
