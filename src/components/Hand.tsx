import { Card } from "./Card";
/* jscpd:ignore-start */
import { DealtCardsHook } from "./DealtCardsHook";
import React from "react";
import { SortOrder } from "../SortOrder";
import { sort } from "../sortCards";
/* jscpd:ignore-end */

interface HandProps extends DealtCardsHook {
  sortOrder: SortOrder;
}

export function Hand({ dealtCards, setDealtCards, sortOrder }: HandProps) {
  const sortedDealtCards = sort(dealtCards, sortOrder);
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
