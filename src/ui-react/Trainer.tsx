import * as classes from "./Trainer.module.css";
import {
  type AnalyticsChoice,
  DECISION_QUALITY_MEASUREMENT,
  readAnalyticsChoice,
  storeAnalyticsChoice,
  storeMeasurementAccepted,
  storePolicyUpdateChoice,
} from "../ui/analyticsConsent";
import { type Card, serializeHand } from "../game/Card";
import { type CribRole, randomCribRole } from "../game/expectedCribPoints";
import {
  parseUrlAnalysisState,
  serializeUrlAnalysisState,
} from "../ui/urlAnalysisState";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";
import type { DealtCard } from "../game/DealtCard";
import { DiscardTallyView } from "./DiscardTallyView";
import { EnterCardsDialog } from "./EnterCardsDialog";
import type { HistoryHandScope } from "./useDiscardTelemetry";
import { InteractiveHand } from "./InteractiveHand";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import type { TrackEvent } from "../ui/trackEvent";
import { clearGoogleAnalyticsCookies } from "../ui/clearGoogleAnalyticsCookies";
import { dealHand } from "../game/dealHand";
import { discardIsComplete } from "../game/discardIsComplete";
import { hasTallyToShow } from "../ui/discardTally";
import { isStableDiscardState } from "../game/isStableDiscardState";
import { toDealtCards } from "../game/toDealtCards";
import { useAnalysisReporting } from "./useAnalysisReporting";
import { usePracticeDrill } from "./usePracticeDrill";

export interface TrainerProps {
  readonly generateRandomNumber: () => number;
  readonly loadGoogleAnalytics: (consented: boolean | null) => void;
  readonly trackEvent: TrackEvent;
  readonly initialCards?: Card[] | null;
  readonly initialCribRole?: CribRole | null;
  readonly initialDiscards?: Card[] | null;
  readonly initialScoreSortKey?: ScoredKeepDiscardSortKey | null;
  readonly initialSortOrder?: SortOrder | null;
  readonly isSeededSession?: boolean;
}

interface DealState {
  readonly cribRole: CribRole;
  readonly dealtCards: DealtCard[];
}

// Invariant: previousUrl is the URL of the entry directly beneath this one.
// The hand scope rides on the entry because its cards cannot identify the hand: a seeded deal and a later hand-entry of the same six cards are different hands that share a key.
interface HistoryEntryState {
  readonly handScope?: HistoryHandScope;
  readonly previousUrl?: string;
}

const getHistoryEntryState = (): HistoryEntryState | null =>
  window.history.state as HistoryEntryState | null;

const getPreviousUrl = (): string | undefined =>
  getHistoryEntryState()?.previousUrl;

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
  const choiceOnFirstRender = useMemo(() => readAnalyticsChoice(), []);
  const [choice, setChoice] = useState<AnalyticsChoice>(choiceOnFirstRender);
  const analyticsConsented = choice.consented;
  const setConsented = useCallback(
    (value: boolean) => {
      setChoice(storeAnalyticsChoice(value));
      if (!value) {
        clearGoogleAnalyticsCookies();
        if (analyticsConsented) {
          window.location.reload();
        }
      }
    },
    [analyticsConsented],
  );
  const choosePolicyUpdate = useCallback((accepted: boolean) => {
    setChoice(storePolicyUpdateChoice(accepted));
  }, []);
  const allowDecisionQuality = useCallback(() => {
    setChoice(storeMeasurementAccepted(DECISION_QUALITY_MEASUREMENT));
  }, []);
  useEffect(() => {
    if (analyticsConsented === false) {
      clearGoogleAnalyticsCookies();
    }
  }, [analyticsConsented]);
  useEffect(() => {
    loadGoogleAnalytics(analyticsConsented);
  }, [analyticsConsented, loadGoogleAnalytics]);
  return {
    allowDecisionQuality,
    choice,
    choosePolicyUpdate,
    setConsented,
    wasAnsweredOnFirstRender: choiceOnFirstRender.consented !== null,
  };
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
  isSeededSession = false,
}: TrainerProps) {
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
      : dealHand(generator);
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
  const {
    allowDecisionQuality,
    choice,
    choosePolicyUpdate,
    setConsented,
    wasAnsweredOnFirstRender,
  } = useAnalyticsConsent(loadGoogleAnalytics);
  const {
    currentHandScope,
    reportAnalysisRendered,
    reportCardToggled,
    reportHandReplaced,
    reportHistoryNavigation,
    tallySummary,
  } = useAnalysisReporting({
    consented: choice.consented,
    cribRole,
    dealtCards,
    decisionQualityConsented: choice.decisionQualityConsented,
    isSeededSession,
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
    const handScope = currentHandScope();
    if (shouldPushHistory.current) {
      window.history.pushState(
        { handScope, previousUrl: window.location.search },
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
      window.history.replaceState(
        { ...getHistoryEntryState(), handScope },
        "",
        url,
      );
    }
    shouldPushHistory.current = false;
  }, [cribRole, currentHandScope, dealtCards, scoreSortKey, sortOrder]);

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
          reportHistoryNavigation(
            newDealtCards,
            getHistoryEntryState()?.handScope ?? null,
            urlState.cribRole,
          );
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
  }, [reportHistoryNavigation]);

  // Preserve the current history entry only when its state is stable.
  // Transient single-card selections get replaced, so Back skips them.
  const markHistoryUpdate = useCallback(() => {
    shouldPushHistory.current = isStableDiscardState(dealtCards);
  }, [dealtCards]);
  const applyManualHand = useCallback(
    (state: DealState) => {
      // Push history when the pre-change state is stable, so Back returns to the prior hand rather than skipping it.
      markHistoryUpdate();
      reportHandReplaced(state.dealtCards, "manual", state.cribRole);
      setDealState(state);
    },
    [markHistoryUpdate, reportHandReplaced],
  );
  const enterCardsDialog = useEnterCardsDialog(
    dealState,
    applyManualHand,
    markHistoryUpdate,
  );
  const drill = usePracticeDrill({
    dealtCards,
    generateRandomNumber: generator,
    loadHand: applyManualHand,
    onAnalysisRendered: reportAnalysisRendered,
  });

  const toggleKept = useCallback(
    (dealOrderIndex: number) => {
      // The array copy shares card objects with the current state.
      // Snapshot history intent before the kept mutation changes it.
      markHistoryUpdate();
      const newDealtCards = [...dealtCards];
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
      const newDealtCard = newDealtCards[dealOrderIndex]!;
      newDealtCard.kept = !newDealtCard.kept;
      reportCardToggled(newDealtCards, newDealtCard.kept);
      setDealState({
        cribRole,
        dealtCards: newDealtCards,
      });
    },
    [cribRole, dealtCards, markHistoryUpdate, reportCardToggled],
  );

  const dealNewHand = useCallback(() => {
    markHistoryUpdate();
    const newDealState = createDealState(dealHand(generator));
    reportHandReplaced(newDealState.dealtCards, "deal", newDealState.cribRole);
    setDealState(newDealState);
  }, [createDealState, generator, markHistoryUpdate, reportHandReplaced]);

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
      <div
        className={`${classes.dynamicUi} ${hasTallyToShow(tallySummary) ? classes.withTally : ""}`}
      >
        <InteractiveHand
          cribRole={cribRole}
          dealtCards={dealtCards}
          onCardChange={toggleKept}
          onDeal={dealNewHand}
          onEnterCards={enterCardsDialog.handleOpen}
          onSortOrderChange={changeSortOrder}
          practiceDrill={
            drill.isActive
              ? {
                  canCommit: discardIsComplete(dealtCards),
                  hasNextHand: drill.hasNextHand,
                  onCommit: drill.onCommit,
                  onExit: drill.onExit,
                  onNextHand: drill.onNextHand,
                  phase: drill.phase,
                  verdict: drill.verdict,
                }
              : null
          }
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
        {discardIsComplete(dealtCards) &&
          (!drill.isActive || drill.phase === "revealed") && (
            <ScoredPossibleKeepDiscards
              cribRole={cribRole}
              dealtCards={dealtCards}
              onAnalysisRendered={drill.handleAnalysisRendered}
              onScoreSortKeyChange={changeScoreSortKey}
              scoreSortKey={scoreSortKey}
              sortOrder={sortOrder}
            />
          )}
        <DiscardTallyView
          onStartAutoDrill={drill.handleStartAutoDrill}
          onStartDrill={drill.handleStartDrill}
          sortOrder={sortOrder}
          summary={tallySummary}
        />
        <AnalyticsConsentDialog
          consent={choice.consented}
          decisionQualityConsented={choice.decisionQualityConsented}
          isPolicyUpdate={choice.needsPolicyUpdateChoice}
          onAllowDecisionQuality={allowDecisionQuality}
          onChange={setConsented}
          onPolicyUpdateChoice={choosePolicyUpdate}
          wasInitiallyConsented={wasAnsweredOnFirstRender}
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
  isSeededSession: false,
};
