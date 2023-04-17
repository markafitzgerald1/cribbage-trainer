import { CARDS_PER_DEALT_HAND, CARDS_PER_DISCARD } from "../game/facts";
import React, { useState } from "react";
import { Calculations } from "./Calculations";
import { DealtCard } from "../game/DealtCard";
import { Hand } from "./Hand";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";
import { dealHand } from "../game/dealHand";

export function Trainer() {
  const [sortOrder, setSortOrder] = useState(SortOrder.Descending);
  const [dealtCards, setDealtCards] = useState<readonly DealtCard[]>(
    dealHand()
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
