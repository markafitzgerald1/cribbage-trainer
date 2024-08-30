import * as classes from "./Trainer.module.css";
import { useCallback, useEffect, useState } from "react";
import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { SortableHand } from "./SortableHand";
import { dealHand } from "../game/dealHand";
import { discardIsComplete } from "../game/discardIsComplete";

interface TrainerProps {
  readonly generateRandomNumber: () => number;
}

export const analyticsConsentKey = "analyticsConsent";

export function Trainer({ generateRandomNumber: generator }: TrainerProps) {
  const [dealtCards, setDealtCards] = useState(dealHand(generator));
  const [sortOrder, setSortOrder] = useState(SortOrder.Descending);
  const [analyticsConsented, setAnalyticsConsented] = useState(
    null as boolean | null,
  );

  const toggleKept = useCallback(
    (dealOrderIndex: number) => {
      const newDealtCards = [...dealtCards];
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
      const newDealtCard = newDealtCards[dealOrderIndex]!;
      newDealtCard.kept = !newDealtCard.kept;
      // eslint-disable-next-line react/no-set-state
      setDealtCards(newDealtCards);
    },
    [dealtCards],
  );

  const setConsented = useCallback((value: boolean) => {
    setAnalyticsConsented(value);
    localStorage.setItem(analyticsConsentKey, JSON.stringify(value));
  }, []);

  useEffect(() => {
    const storedConsent = localStorage.getItem(analyticsConsentKey);
    if (storedConsent !== null) {
      setAnalyticsConsented(JSON.parse(storedConsent) as boolean);
    }
  }, []);

  return (
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
      <AnalyticsConsentDialog
        consent={analyticsConsented}
        onChange={setConsented}
      />
    </div>
  );
}
