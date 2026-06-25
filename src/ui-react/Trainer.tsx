import * as classes from "./Trainer.module.css";
import { type CribRole, randomCribRole } from "../game/expectedCribPoints";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";
import { type Card } from "../game/Card";
import type { DealtCard } from "../game/DealtCard";
import { InteractiveHand } from "./InteractiveHand";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { discardIsComplete } from "../game/discardIsComplete";

export interface TrainerProps {
  readonly generateRandomNumber: () => number;
  readonly loadGoogleAnalytics: (consented: boolean | null) => void;
  readonly initialCards?: Card[] | null;
}

export const analyticsConsentKey = "analyticsConsent";

const getStoredConsent = (): boolean | null => {
  const storedConsent = localStorage.getItem(analyticsConsentKey);
  if (storedConsent === null) {
    return null;
  }
  return JSON.parse(storedConsent) as boolean;
};

interface DealState {
  readonly cribRole: CribRole;
  readonly dealtCards: DealtCard[];
}

export function Trainer({
  generateRandomNumber: generator,
  loadGoogleAnalytics,
  initialCards = null,
}: TrainerProps) {
  const dealHandWithGenerator = useCallback(
    () => dealHand(generator),
    [generator],
  );
  const createDealState = useCallback(
    (cards: DealtCard[]): DealState => ({
      cribRole: randomCribRole(generator),
      dealtCards: cards,
    }),
    [generator],
  );
  const [dealState, setDealState] = useState<DealState>(() => {
    if (initialCards) {
      return createDealState(
        initialCards.map((card, index) => ({
          ...card,
          dealOrder: index,
          kept: true,
        })),
      );
    }
    return createDealState(dealHandWithGenerator());
  });
  const { cribRole, dealtCards } = dealState;
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Descending);
  const storedConsentOnFirstRender = useMemo(() => getStoredConsent(), []);
  const [analyticsConsented, setAnalyticsConsented] = useState<boolean | null>(
    storedConsentOnFirstRender,
  );

  const toggleKept = useCallback(
    (dealOrderIndex: number) => {
      const newDealtCards = [...dealtCards];
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
      const newDealtCard = newDealtCards[dealOrderIndex]!;
      newDealtCard.kept = !newDealtCard.kept;
      setDealState({
        cribRole,
        dealtCards: newDealtCards,
      });
    },
    [cribRole, dealtCards],
  );

  const dealNewHand = useCallback(() => {
    setDealState(createDealState(dealHandWithGenerator()));
  }, [createDealState, dealHandWithGenerator]);

  const setConsented = useCallback((value: boolean) => {
    setAnalyticsConsented(value);
    localStorage.setItem(analyticsConsentKey, JSON.stringify(value));
  }, []);

  useEffect(() => {
    loadGoogleAnalytics(analyticsConsented);
  }, [analyticsConsented, loadGoogleAnalytics]);

  return (
    <div className={classes.dynamicUi}>
      <InteractiveHand
        cribRole={cribRole}
        dealtCards={dealtCards}
        onCardChange={toggleKept}
        onDeal={dealNewHand}
        onSortOrderChange={setSortOrder}
        sortOrder={sortOrder}
      />
      {discardIsComplete(dealtCards) && (
        <ScoredPossibleKeepDiscards
          cribRole={cribRole}
          dealtCards={dealtCards}
          sortOrder={sortOrder}
        />
      )}
      <AnalyticsConsentDialog
        consent={analyticsConsented}
        onChange={setConsented}
        wasInitiallyConsented={storedConsentOnFirstRender !== null}
      />
    </div>
  );
}

Trainer.defaultProps = {
  initialCards: null,
};
