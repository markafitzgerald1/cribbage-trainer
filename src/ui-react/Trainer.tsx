import * as classes from "./Trainer.module.css";
import { useCallback, useEffect, useState } from "react";
import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";
import { InteractiveHand } from "./InteractiveHand";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { discardIsComplete } from "../game/discardIsComplete";

export interface TrainerProps {
  readonly generateRandomNumber: () => number;
  readonly loadGoogleAnalytics: (consented: boolean | null) => void;
}

export const analyticsConsentKey = "analyticsConsent";

export function Trainer({
  generateRandomNumber: generator,
  loadGoogleAnalytics,
}: TrainerProps) {
  const dealHandWithGenerator = useCallback(
    () => dealHand(generator),
    [generator],
  );
  const [dealtCards, setDealtCards] = useState(dealHandWithGenerator);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Descending);
  const [analyticsConsented, setAnalyticsConsented] = useState(
    null as boolean | null,
  );

  const toggleKept = useCallback(
    (dealOrderIndex: number) => {
      const newDealtCards = [...dealtCards];
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
      const newDealtCard = newDealtCards[dealOrderIndex]!;
      newDealtCard.kept = !newDealtCard.kept;
      setDealtCards(newDealtCards);
    },
    [dealtCards],
  );

  const dealNewHand = useCallback(() => {
    setDealtCards(dealHandWithGenerator);
  }, [dealHandWithGenerator]);

  const setConsented = useCallback(
    (value: boolean) => {
      setAnalyticsConsented(value);
      localStorage.setItem(analyticsConsentKey, JSON.stringify(value));
      loadGoogleAnalytics(value);
    },
    [loadGoogleAnalytics],
  );

  useEffect(() => {
    const storedConsent = localStorage.getItem(analyticsConsentKey);
    if (storedConsent === null) {
      loadGoogleAnalytics(null);
    } else {
      const consentValue = JSON.parse(storedConsent) as boolean;
      setAnalyticsConsented(consentValue);
      loadGoogleAnalytics(consentValue);
    }
  }, [loadGoogleAnalytics]);

  return (
    <div className={classes.dynamicUi}>
      <InteractiveHand
        dealtCards={dealtCards}
        onCardChange={toggleKept}
        onDeal={dealNewHand}
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
