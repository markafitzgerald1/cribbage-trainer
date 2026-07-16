import {
  type AnalysisSource,
  type TrackEvent,
  type TrainerEventName,
  type TrainerEventParams,
} from "../ui/trackEvent";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { DealtCard } from "../game/DealtCard";
import { discardIsComplete } from "../game/discardIsComplete";
import { serializeHand } from "../game/Card";

export type HandReplacementCause = "deal" | "manual";

export const ANALYSIS_SETTLE_MS = 500;

const NONCE_RADIX = 36;
const NONCE_RANDOM_OFFSET = "0.".length;

// The nonce only needs uniqueness within one browser session, so wall-clock time plus Math.random suffices.
// The seeded deal generator must not be consumed here: that would change which hands seeded links deal.
const createDealNonce = () =>
  `${Date.now().toString(NONCE_RADIX)}-${Math.random()
    .toString(NONCE_RADIX)
    .slice(NONCE_RANDOM_OFFSET)}`;

interface ShownAnalysis {
  readonly analysisIndex: number;
  readonly discardKey: string;
}

interface DealTelemetryState {
  analysisCount: number;
  readonly dealNonce: string;
  readonly handKey: string;
  hasInteractiveAnalysis: boolean;
  pendingCards: readonly DealtCard[];
  shown: ShownAnalysis | null;
  source: AnalysisSource;
}

const createDealTelemetryState = (
  dealtCards: readonly DealtCard[],
  source: AnalysisSource,
): DealTelemetryState => ({
  analysisCount: 0,
  dealNonce: createDealNonce(),
  handKey: serializeHand(dealtCards),
  hasInteractiveAnalysis: false,
  pendingCards: dealtCards,
  shown: null,
  source,
});

const discardedCards = (dealtCards: readonly DealtCard[]) =>
  dealtCards.filter((dealtCard) => !dealtCard.kept);

export interface DiscardTelemetryProps {
  readonly consented: boolean | null;
  readonly dealtCards: readonly DealtCard[];
  readonly trackEvent: TrackEvent;
  readonly wasDeepLinked: boolean;
}

export interface DiscardTelemetry {
  readonly reportCardToggled: (
    dealtCards: readonly DealtCard[],
    kept: boolean,
  ) => void;
  readonly reportHandReplaced: (
    dealtCards: readonly DealtCard[],
    cause: HandReplacementCause,
  ) => void;
  readonly reportHistoryNavigation: (dealtCards: readonly DealtCard[]) => void;
}

// GA4 cannot reconstruct "first stable analysis per deal" after the fact, so the per-deal nonce, 1-based analysis index, and first-interactive flag are stamped at emit time.
// Only the first render's `dealtCards` is read here; later states arrive through the report methods.
export const useDiscardTelemetry = ({
  consented,
  dealtCards,
  trackEvent,
  wasDeepLinked,
}: DiscardTelemetryProps): DiscardTelemetry => {
  const stateRef = useRef(
    createDealTelemetryState(
      dealtCards,
      wasDeepLinked ? "deeplink" : "interactive",
    ),
  );
  const latestRef = useRef({ consented, trackEvent });
  useEffect(() => {
    latestRef.current = { consented, trackEvent };
  });
  const emit = useCallback(
    (eventName: TrainerEventName, params: TrainerEventParams) => {
      const latest = latestRef.current;
      latest.trackEvent(latest.consented, eventName, params);
    },
    [],
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearSettleTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  const closeShownAnalysis = useCallback(
    (state: DealTelemetryState) => {
      if (state.shown) {
        emit("analysis_unshown", {
          analysisIndex: state.shown.analysisIndex,
          dealNonce: state.dealNonce,
        });
        state.shown = null;
      }
    },
    [emit],
  );
  const settle = useCallback(() => {
    const state = stateRef.current;
    if (!discardIsComplete(state.pendingCards)) {
      closeShownAnalysis(state);
      return;
    }
    const discardKey = serializeHand(discardedCards(state.pendingCards));
    if (state.shown?.discardKey === discardKey) {
      return;
    }
    state.analysisCount += 1;
    const isFirstAnalysis =
      state.source === "interactive" && !state.hasInteractiveAnalysis;
    state.hasInteractiveAnalysis ||= state.source === "interactive";
    state.shown = { analysisIndex: state.analysisCount, discardKey };
    emit("analysis_shown", {
      analysisIndex: state.analysisCount,
      dealNonce: state.dealNonce,
      isFirstAnalysis,
      source: state.source,
    });
  }, [closeShownAnalysis, emit]);
  const scheduleSettle = useCallback(() => {
    clearSettleTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      settle();
    }, ANALYSIS_SETTLE_MS);
  }, [clearSettleTimer, settle]);
  const replaceHand = useCallback(
    (newDealtCards: readonly DealtCard[], source: AnalysisSource) => {
      clearSettleTimer();
      closeShownAnalysis(stateRef.current);
      stateRef.current = createDealTelemetryState(newDealtCards, source);
      scheduleSettle();
    },
    [clearSettleTimer, closeShownAnalysis, scheduleSettle],
  );
  const reportCardToggled = useCallback(
    (newDealtCards: readonly DealtCard[], kept: boolean) => {
      const state = stateRef.current;
      state.source = "interactive";
      state.pendingCards = newDealtCards;
      // The hand checkboxes are keep toggles, so kept === false means the card was just selected for discard.
      emit(kept ? "card_unselected" : "card_selected", {
        dealNonce: state.dealNonce,
        discardCount: discardedCards(newDealtCards).length,
      });
      scheduleSettle();
    },
    [emit, scheduleSettle],
  );
  const reportHandReplaced = useCallback(
    (newDealtCards: readonly DealtCard[], cause: HandReplacementCause) => {
      replaceHand(newDealtCards, "interactive");
      if (cause === "deal") {
        emit("deal_clicked", { dealNonce: stateRef.current.dealNonce });
      }
    },
    [emit, replaceHand],
  );
  const reportHistoryNavigation = useCallback(
    (newDealtCards: readonly DealtCard[]) => {
      const state = stateRef.current;
      if (serializeHand(newDealtCards) === state.handKey) {
        // Back/Forward within the same deal keeps the deal's nonce.
        state.source = "history";
        state.pendingCards = newDealtCards;
        scheduleSettle();
      } else {
        replaceHand(newDealtCards, "history");
      }
    },
    [replaceHand, scheduleSettle],
  );
  useEffect(() => {
    // A deep-linked complete discard settles like any other analysis state.
    scheduleSettle();
    return clearSettleTimer;
  }, [clearSettleTimer, scheduleSettle]);
  return useMemo(
    () => ({ reportCardToggled, reportHandReplaced, reportHistoryNavigation }),
    [reportCardToggled, reportHandReplaced, reportHistoryNavigation],
  );
};
