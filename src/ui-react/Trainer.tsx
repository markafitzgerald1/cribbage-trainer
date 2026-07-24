import * as classes from "./Trainer.module.css";
import { type Card, serializeHand } from "../game/Card";
import { type CribRole, randomCribRole } from "../game/expectedCribPoints";
import {
  parseUrlAnalysisState,
  serializeUrlAnalysisState,
} from "../ui/urlAnalysisState";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";
import type { DealtCard } from "../game/DealtCard";
import { EnterCardsDialog } from "./EnterCardsDialog";
import { InteractiveHand } from "./InteractiveHand";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import type { TrackEvent } from "../ui/trackEvent";
import { clearGoogleAnalyticsCookies } from "../ui/clearGoogleAnalyticsCookies";
import { dealHand } from "../game/dealHand";
import { discardIsComplete } from "../game/discardIsComplete";
import { isStableDiscardState } from "../game/isStableDiscardState";
import { toDealtCards } from "../game/toDealtCards";
import { useDiscardTelemetry } from "./useDiscardTelemetry";

export interface TrainerProps {
  readonly generateRandomNumber: () => number;
  readonly loadGoogleAnalytics: (consented: boolean | null) => void;
  readonly trackEvent: TrackEvent;
  readonly initialCards?: Card[] | null;
  readonly initialCribRole?: CribRole | null;
  readonly initialDiscards?: Card[] | null;
  readonly initialScoreSortKey?: ScoredKeepDiscardSortKey | null;
  readonly initialSortOrder?: SortOrder | null;
}

export const analyticsConsentKey = "analyticsConsent-2026-07-23";
const legacyAnalyticsConsentKey = "analyticsConsent";

const getStoredConsent = (): boolean | null => {
  const storedConsent = localStorage.getItem(analyticsConsentKey);
  if (storedConsent === "true") {
    return true;
  }
  if (storedConsent === "false") {
    return false;
  }
  localStorage.removeItem(analyticsConsentKey);
  return null;
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

const isUnchangedEnteredHand = (
  cards: readonly Card[],
  cribRole: CribRole,
  dealState: DealState,
) =>
  cribRole === dealState.cribRole &&
  dealState.dealtCards.every((card) => card.kept) &&
  serializeHand(cards) === serializeHand(dealState.dealtCards);

const useAnalyticsConsent = (
  loadGoogleAnalytics: (consented: boolean | null) => void,
) => {
  const storedConsentOnFirstRender = useMemo(() => {
    localStorage.removeItem(legacyAnalyticsConsentKey);
    return getStoredConsent();
  }, []);
  const [analyticsConsented, setAnalyticsConsented] = useState<boolean | null>(
    storedConsentOnFirstRender,
  );
  const setConsented = useCallback(
    (value: boolean) => {
      setAnalyticsConsented(value);
      localStorage.setItem(analyticsConsentKey, JSON.stringify(value));
      if (!value) {
        clearGoogleAnalyticsCookies();
        if (analyticsConsented) {
          window.location.reload();
        }
      }
    },
    [analyticsConsented],
  );
  useEffect(() => {
    if (analyticsConsented === false) {
      clearGoogleAnalyticsCookies();
    }
  }, [analyticsConsented]);
  useEffect(() => {
    loadGoogleAnalytics(analyticsConsented);
  }, [analyticsConsented, loadGoogleAnalytics]);
  return { analyticsConsented, setConsented, storedConsentOnFirstRender };
};

const useEnterCardsDialog = (
  dealState: DealState,
  setDealState: (state: DealState) => void,
  markHistoryUpdate: () => void,
) => {
  const [show, setShow] = useState(false);
  const handleOpen = useCallback(() => {
    setShow(true);
  }, []);
  const handleClose = useCallback(() => {
    setShow(false);
  }, []);
  const handleSubmit = useCallback(
    (cards: Card[], cribRole: CribRole) => {
      if (isUnchangedEnteredHand(cards, cribRole, dealState)) {
        setShow(false);
        return;
      }
      markHistoryUpdate();
      setDealState({
        cribRole,
        dealtCards: toDealtCards(cards, null),
      });
      setShow(false);
    },
    [dealState, markHistoryUpdate, setDealState],
  );
  return { handleClose, handleOpen, handleSubmit, show };
};

export function Trainer({
  generateRandomNumber: generator,
  loadGoogleAnalytics,
  trackEvent,
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
  const { analyticsConsented, setConsented, storedConsentOnFirstRender } =
    useAnalyticsConsent(loadGoogleAnalytics);
  const telemetry = useDiscardTelemetry({
    consented: analyticsConsented,
    dealtCards,
    trackEvent,
    wasDeepLinked: initialCards !== null,
  });
  const isMergingHistoryEntry = useRef(false);
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
      isMergingHistoryEntry.current = true;
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
      const isInternalMerge = isMergingHistoryEntry.current;
      isMergingHistoryEntry.current = false;
      const urlState = parseUrlAnalysisState(window.location.search);
      if (urlState.cards) {
        const { cards, discards } = urlState;
        const newDealtCards = toDealtCards(cards, discards);
        // Returning to the covered stable URL is cleanup, not user navigation.
        if (!isInternalMerge) {
          telemetry.reportHistoryNavigation(newDealtCards);
        }
        setDealState((previous) => ({
          cribRole: urlState.cribRole ?? previous.cribRole,
          dealtCards: newDealtCards,
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
  }, [telemetry]);

  // Preserve the current history entry only when its state is stable.
  // Transient single-card selections get replaced, so Back skips them.
  const markHistoryUpdate = useCallback(() => {
    shouldPushHistory.current = isStableDiscardState(dealtCards);
  }, [dealtCards]);
  const applyManualHand = useCallback(
    (state: DealState) => {
      telemetry.reportHandReplaced(state.dealtCards, "manual");
      setDealState(state);
    },
    [telemetry],
  );
  const enterCardsDialog = useEnterCardsDialog(
    dealState,
    applyManualHand,
    markHistoryUpdate,
  );

  const toggleKept = useCallback(
    (dealOrderIndex: number) => {
      // The array copy shares card objects with the current state.
      // Snapshot history intent before the kept mutation changes it.
      markHistoryUpdate();
      const newDealtCards = [...dealtCards];
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
      const newDealtCard = newDealtCards[dealOrderIndex]!;
      newDealtCard.kept = !newDealtCard.kept;
      telemetry.reportCardToggled(newDealtCards, newDealtCard.kept);
      setDealState({
        cribRole,
        dealtCards: newDealtCards,
      });
    },
    [cribRole, dealtCards, markHistoryUpdate, telemetry],
  );

  const dealNewHand = useCallback(() => {
    markHistoryUpdate();
    const newDealState = createDealState(dealHandWithGenerator());
    telemetry.reportHandReplaced(newDealState.dealtCards, "deal");
    setDealState(newDealState);
  }, [createDealState, dealHandWithGenerator, markHistoryUpdate, telemetry]);

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

  return (
    <div className={classes.app}>
      <header className={classes.appHeader}>
        <h1 className={classes.appTitle}>Cribbage Trainer</h1>
        <p className={classes.tagline}>
          Sharpen your cribbage discards with expected-score analysis.
        </p>
      </header>
      <div className={classes.dynamicUi}>
        <InteractiveHand
          cribRole={cribRole}
          dealtCards={dealtCards}
          onCardChange={toggleKept}
          onDeal={dealNewHand}
          onEnterCards={enterCardsDialog.handleOpen}
          onSortOrderChange={changeSortOrder}
          sortOrder={sortOrder}
        />
        <EnterCardsDialog
          initialCards={dealtCards}
          initialCribRole={cribRole}
          key={`${enterCardsDialog.show}-${cribRole}-${serializeHand(dealtCards)}`}
          onClose={enterCardsDialog.handleClose}
          onSubmit={enterCardsDialog.handleSubmit}
          show={enterCardsDialog.show}
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
