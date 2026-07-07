import * as classes from "./Trainer.module.css";
import { type CribRole, randomCribRole } from "../game/expectedCribPoints";
import {
  parseUrlAnalysisState,
  serializeUrlAnalysisState,
} from "../ui/urlAnalysisState";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";
import { type Card } from "../game/Card";
import type { DealtCard } from "../game/DealtCard";
import { InteractiveHand } from "./InteractiveHand";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { discardIsComplete } from "../game/discardIsComplete";
import { toDealtCards } from "../game/toDealtCards";

export interface TrainerProps {
  readonly generateRandomNumber: () => number;
  readonly loadGoogleAnalytics: (consented: boolean | null) => void;
  readonly initialCards?: Card[] | null;
  readonly initialCribRole?: CribRole | null;
  readonly initialDiscards?: Card[] | null;
  readonly initialSortOrder?: SortOrder | null;
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
  initialCribRole = null,
  initialDiscards = null,
  initialSortOrder = null,
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
      return {
        cribRole: initialCribRole ?? randomCribRole(generator),
        dealtCards: toDealtCards(initialCards, initialDiscards),
      };
    }
    return createDealState(dealHandWithGenerator());
  });
  const { cribRole, dealtCards } = dealState;
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    initialSortOrder ?? SortOrder.Descending,
  );
  const storedConsentOnFirstRender = useMemo(() => getStoredConsent(), []);
  const [analyticsConsented, setAnalyticsConsented] = useState<boolean | null>(
    storedConsentOnFirstRender,
  );
  const shouldPushHistory = useRef(false);

  useEffect(() => {
    const url = serializeUrlAnalysisState(window.location.search, {
      cribRole,
      dealtCards,
      sortOrder,
    });
    if (shouldPushHistory.current) {
      window.history.pushState(null, "", url);
    } else {
      window.history.replaceState(null, "", url);
    }
    shouldPushHistory.current = false;
  }, [cribRole, dealtCards, sortOrder]);

  useEffect(() => {
    const handlePopState = () => {
      const urlState = parseUrlAnalysisState(window.location.search);
      if (urlState.cards) {
        const { cards, discards } = urlState;
        setDealState((previous) => ({
          cribRole: urlState.cribRole ?? previous.cribRole,
          dealtCards: toDealtCards(cards, discards),
        }));
      }
      if (urlState.sortOrder !== null) {
        setSortOrder(urlState.sortOrder);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const toggleKept = useCallback(
    (dealOrderIndex: number) => {
      const newDealtCards = [...dealtCards];
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
      const newDealtCard = newDealtCards[dealOrderIndex]!;
      newDealtCard.kept = !newDealtCard.kept;
      shouldPushHistory.current = true;
      setDealState({
        cribRole,
        dealtCards: newDealtCards,
      });
    },
    [cribRole, dealtCards],
  );

  const dealNewHand = useCallback(() => {
    shouldPushHistory.current = true;
    setDealState(createDealState(dealHandWithGenerator()));
  }, [createDealState, dealHandWithGenerator]);

  const changeSortOrder = useCallback((newSortOrder: SortOrder) => {
    shouldPushHistory.current = true;
    setSortOrder(newSortOrder);
  }, []);

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
        onSortOrderChange={changeSortOrder}
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
  initialCribRole: null,
  initialDiscards: null,
  initialSortOrder: null,
};
