import * as classes from "./Trainer.module.css";
import React, { useState } from "react";
import { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { SortableHand } from "./SortableHand";
import { dealHand } from "../game/dealHand";
import { discardIsComplete } from "../game/discardIsComplete";

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
      <div className={classes.dynamicUi}>
        <SortableHand
          dealtCards={dealtCards}
          setDealtCards={setDealtCards}
          setSortOrder={setSortOrder}
          sortOrder={sortOrder}
        />
        {discardIsComplete(dealtCards) && (
          <ScoredPossibleKeepDiscards
            dealtCards={dealtCards}
            sortOrder={sortOrder}
          />
        )}
      </div>
    </React.StrictMode>
  );
}
