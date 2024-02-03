import * as classes from "./Trainer.module.css";
import React, { useCallback, useState } from "react";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { SortableHand } from "./SortableHand";
import { discardIsComplete } from "../game/discardIsComplete";
import { dealHand as gameDealHand } from "../game/dealHand";

interface TrainerProps {
  readonly generateRandomNumber: () => number;
}

export function Trainer({ generateRandomNumber: generator }: TrainerProps) {
  const [dealtCards, setDealtCards] = useState(gameDealHand(generator));
  const [sortOrder, setSortOrder] = useState(SortOrder.Descending);

  const toggleKept = useCallback(
    (dealOrderIndex: number) => {
      const newDealtCards = [...dealtCards];
      // eslint-disable-next-line security/detect-object-injection
      const newDealtCard = newDealtCards[dealOrderIndex]!;
      newDealtCard.kept = !newDealtCard.kept;
      // eslint-disable-next-line react/no-set-state
      setDealtCards(newDealtCards);
    },
    [dealtCards],
  );

  return (
    <React.StrictMode>
      <div className={classes.dynamicUi}>
        <SortableHand
          dealtCards={dealtCards}
          onCardChange={toggleKept}
          onSortOrderChange={setSortOrder}
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
