/* jscpd:ignore-start */
import React, { useState } from "react";
import { Calculations } from "./Calculations";
import { DealtCard } from "../game/DealtCard";
import { Hand } from "./Hand";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";
import { dealHand } from "../game/dealHand";
import { discardIsComplete } from "../game/discardIsComplete";
/* jscpd:ignore-end */

interface RandomNumberGenerator {
  readonly generateRandomNumber: () => number;
}

export function Trainer({ generateRandomNumber }: RandomNumberGenerator) {
  const [sortOrder, setSortOrder] = useState(SortOrder.Descending);
  const [dealtCards, setDealtCards] = useState<readonly DealtCard[]>(
    dealHand(generateRandomNumber),
  );

  return (
    <React.StrictMode>
      <h1>Cribbage Trainer</h1>
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
        {discardIsComplete(dealtCards) && (
          <Calculations
            dealtCards={dealtCards}
            sortOrder={sortOrder}
          />
        )}
      </div>
    </React.StrictMode>
  );
}
