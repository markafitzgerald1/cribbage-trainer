import {
  type AnalysisSource,
  type HandStartSource,
  type TrackEvent,
  type TrainerEventName,
  type TrainerEventParams,
} from "../ui/trackEvent";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { DealtCard } from "../game/DealtCard";
import { discardIsComplete } from "../game/discardIsComplete";
import { serializeHand } from "../game/Card";

export type HandReplacementCause = "deal" | "manual";

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
  handStarted: boolean;
  readonly handStartSource: HandStartSource;
  readonly handKey: string;
  hasInteractiveAnalysis: boolean;
  pendingCards: readonly DealtCard[];
  shown: ShownAnalysis | null;
  source: AnalysisSource;
}

const createDealTelemetryState = (
  dealtCards: readonly DealtCard[],
  source: AnalysisSource,
  handStartSource: HandStartSource,
): DealTelemetryState => ({
  analysisCount: 0,
  dealNonce: createDealNonce(),
  handKey: serializeHand(dealtCards),
  handStartSource,
  handStarted: false,
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

// GA4 cannot reconstruct "first analysis exposure per deal" after the fact, so the per-deal nonce, 1-based analysis index, and first-interactive flag are stamped at emit time.
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
      wasDeepLinked ? "deeplink" : "initial",
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
  const reportHandStarted = useCallback(
    (state: DealTelemetryState) => {
      if (state.handStarted || latestRef.current.consented !== true) {
        return;
      }
      state.handStarted = true;
      emit("hand_started", {
        dealNonce: state.dealNonce,
        source: state.handStartSource,
      });
    },
    [emit],
  );
  useEffect(() => {
    reportHandStarted(stateRef.current);
  }, [consented, reportHandStarted, trackEvent]);
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
  const reportAnalysisState = useCallback(
    (state: DealTelemetryState) => {
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
    },
    [closeShownAnalysis, emit],
  );
  const replaceHand = useCallback(
    (
      newDealtCards: readonly DealtCard[],
      source: AnalysisSource,
      handStartSource: HandStartSource,
    ) => {
      closeShownAnalysis(stateRef.current);
      const state = createDealTelemetryState(
        newDealtCards,
        source,
        handStartSource,
      );
      stateRef.current = state;
      return state;
    },
    [closeShownAnalysis],
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
      reportAnalysisState(state);
    },
    [emit, reportAnalysisState],
  );
  const reportHandReplaced = useCallback(
    (newDealtCards: readonly DealtCard[], cause: HandReplacementCause) => {
      const state = replaceHand(newDealtCards, "interactive", cause);
      if (cause === "deal") {
        emit("deal_clicked", { dealNonce: state.dealNonce });
      }
      reportHandStarted(state);
      reportAnalysisState(state);
    },
    [emit, replaceHand, reportAnalysisState, reportHandStarted],
  );
  const reportHistoryNavigation = useCallback(
    (newDealtCards: readonly DealtCard[]) => {
      const state = stateRef.current;
      if (serializeHand(newDealtCards) === state.handKey) {
        // Back/Forward within the same deal keeps the deal's nonce.
        state.source = "history";
        state.pendingCards = newDealtCards;
        reportAnalysisState(state);
      } else {
        const newState = replaceHand(newDealtCards, "history", "history");
        reportHandStarted(newState);
        reportAnalysisState(newState);
      }
    },
    [replaceHand, reportAnalysisState, reportHandStarted],
  );
  useEffect(() => {
    // A deep-linked complete discard is reported after its first render.
    reportAnalysisState(stateRef.current);
  }, [reportAnalysisState]);
  return useMemo(
    () => ({ reportCardToggled, reportHandReplaced, reportHistoryNavigation }),
    [reportCardToggled, reportHandReplaced, reportHistoryNavigation],
  );
};
