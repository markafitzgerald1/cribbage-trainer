import { CARDS, INDICES_PER_SUIT } from "../game/Card";
import React, { useState } from "react";
import { CARDS_PER_DISCARD } from "../game/facts";
import { Calculations } from "./Calculations";
import { DealtCard } from "../game/DealtCard";
import { Hand } from "./Hand";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";

const CARDS_PER_DEALT_HAND = 6;

export function Trainer() {
  const [sortOrder, setSortOrder] = useState(SortOrder.Descending);
  const [dealtCards, setDealtCards] = useState<readonly DealtCard[]>(
    Array.from({ length: CARDS_PER_DEALT_HAND }, () =>
      Math.floor(Math.random() * INDICES_PER_SUIT)
    ).map((rankValue, dealOrder) => ({
      ...CARDS[rankValue]!,
      dealOrder,
      kept: true,
    }))
  );

  return (
    <React.StrictMode>
      <div>
        <SortOrderInput
          setSortOrder={setSortOrder}
          sortOrder={sortOrder}
        />
        <Hand
          dealtCards={dealtCards}
          setDealtCards={setDealtCards}
          sortOrder={sortOrder}
        />
        {!(
          dealtCards.filter((dealtCard) => dealtCard.kept).length ===
          CARDS_PER_DEALT_HAND - CARDS_PER_DISCARD
        ) || (
          <Calculations
            dealtCards={dealtCards}
            sortOrder={sortOrder}
          />
        )}
      </div>
    </React.StrictMode>
  );
}
