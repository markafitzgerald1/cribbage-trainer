import * as classes from "./Trainer.module.css";
/* jscpd:ignore-start */
import React, { useState } from "react";
import { Calculations } from "./Calculations";
import { DealtCard } from "../game/DealtCard";
import { SortOrder } from "../ui/SortOrder";
import { SortableHand } from "./SortableHand";
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
      <div className={classes.dynamicUi}>
        <SortableHand
          dealtCards={dealtCards}
          setDealtCards={setDealtCards}
          setSortOrder={setSortOrder}
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
