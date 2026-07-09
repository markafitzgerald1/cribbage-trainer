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
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { discardIsComplete } from "../game/discardIsComplete";
import { isStableDiscardState } from "../game/isStableDiscardState";
import { toDealtCards } from "../game/toDealtCards";

export interface TrainerProps {
  readonly generateRandomNumber: () => number;
  readonly loadGoogleAnalytics: (consented: boolean | null) => void;
  readonly initialCards?: Card[] | null;
  readonly initialCribRole?: CribRole | null;
  readonly initialDiscards?: Card[] | null;
  readonly initialScoreSortKey?: ScoredKeepDiscardSortKey | null;
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

// Invariant: previousUrl is the URL of the entry directly beneath this one.
interface HistoryEntryState {
  readonly previousUrl?: string;
}

const getPreviousUrl = (): string | undefined =>
  (window.history.state as HistoryEntryState | null)?.previousUrl;

export function Trainer({
  generateRandomNumber: generator,
  loadGoogleAnalytics,
  initialCards = null,
  initialCribRole = null,
  initialDiscards = null,
  initialScoreSortKey = null,
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
    const dealtCards = initialCards
      ? toDealtCards(initialCards, initialDiscards)
      : dealHandWithGenerator();
    return {
      cribRole: initialCribRole ?? randomCribRole(generator),
      dealtCards,
    };
  });
  const { cribRole, dealtCards } = dealState;
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    initialSortOrder ?? SortOrder.Descending,
  );
  const [scoreSortKey, setScoreSortKey] = useState<ScoredKeepDiscardSortKey>(
    initialScoreSortKey ?? ScoredKeepDiscardSortKey.ExpectedNetPoints,
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
      scoreSortKey,
      sortOrder,
    });
    if (shouldPushHistory.current) {
      window.history.pushState(
        { previousUrl: window.location.search },
        "",
        url,
      );
    } else if (url === getPreviousUrl()) {
      // Merging avoids an adjacent duplicate that would make Back a no-op.
      // The abandoned transient entry survives only as a Forward entry.
      window.history.back();
    } else {
      // Keep previousUrl so later settles can still detect convergence.
      window.history.replaceState(window.history.state, "", url);
    }
    shouldPushHistory.current = false;
  }, [cribRole, dealtCards, scoreSortKey, sortOrder]);

  useEffect(() => {
    const handlePopState = () => {
      // Navigation must never push, even if a click just set the push flag.
      shouldPushHistory.current = false;
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
      if (urlState.scoreSortKey !== null) {
        setScoreSortKey(urlState.scoreSortKey);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Preserve the current history entry only when its state is stable.
  // Transient single-card selections get replaced, so Back skips them.
  const markHistoryUpdate = useCallback(() => {
    shouldPushHistory.current = isStableDiscardState(dealtCards);
  }, [dealtCards]);

  const toggleKept = useCallback(
    (dealOrderIndex: number) => {
      // The array copy shares card objects with the current state.
      // Snapshot history intent before the kept mutation changes it.
      markHistoryUpdate();
      const newDealtCards = [...dealtCards];
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
      const newDealtCard = newDealtCards[dealOrderIndex]!;
      newDealtCard.kept = !newDealtCard.kept;
      setDealState({
        cribRole,
        dealtCards: newDealtCards,
      });
    },
    [cribRole, dealtCards, markHistoryUpdate],
  );

  const dealNewHand = useCallback(() => {
    markHistoryUpdate();
    setDealState(createDealState(dealHandWithGenerator()));
  }, [createDealState, dealHandWithGenerator, markHistoryUpdate]);

  const changeSortOrder = useCallback(
    (newSortOrder: SortOrder) => {
      markHistoryUpdate();
      setSortOrder(newSortOrder);
    },
    [markHistoryUpdate],
  );

  const changeScoreSortKey = useCallback(
    (newScoreSortKey: ScoredKeepDiscardSortKey) => {
      markHistoryUpdate();
      setScoreSortKey(newScoreSortKey);
    },
    [markHistoryUpdate],
  );

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
          onScoreSortKeyChange={changeScoreSortKey}
          scoreSortKey={scoreSortKey}
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
  initialScoreSortKey: null,
  initialSortOrder: null,
};
