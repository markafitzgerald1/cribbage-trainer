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

// One telemetry hand is identified globally, not merely within a browser session, so warehouse analysis may treat the value as a key.
// The seeded deal generator must not be consumed here: that would change which hands seeded links deal.
const createDealNonce = () => crypto.randomUUID();

interface ShownAnalysis {
  readonly analysisIndex: number;
  readonly discardKey: string;
  // An exposure that consent kept off the wire must also close silently.
  // Otherwise Google Analytics receives an unshown whose shown it never saw.
  readonly reported: boolean;
}

// Provenance is fixed when the hand is created, because the URL at emit time no longer says where the cards came from.
interface HandScope {
  readonly generatedFromSeed: boolean;
  readonly handStartSource: HandStartSource;
  readonly source: AnalysisSource;
}

interface DealTelemetryState {
  analysisCount: number;
  readonly dealNonce: string;
  readonly generatedFromSeed: boolean;
  handStarted: boolean;
  readonly handStartSource: HandStartSource;
  readonly handKey: string;
  pendingCards: readonly DealtCard[];
  shown: ShownAnalysis | null;
  source: AnalysisSource;
}

const createDealTelemetryState = (
  dealtCards: readonly DealtCard[],
  { generatedFromSeed, handStartSource, source }: HandScope,
): DealTelemetryState => ({
  analysisCount: 0,
  dealNonce: createDealNonce(),
  generatedFromSeed,
  handKey: serializeHand(dealtCards),
  handStartSource,
  handStarted: false,
  pendingCards: dealtCards,
  shown: null,
  source,
});

// Back or Forward can restore a hand at zero discards, whose next complete discard is still stamped a first instinct, so a restored hand has to carry the provenance it had when this session generated it.
const rememberSeededHand = (
  seededHandKeys: Set<string>,
  state: DealTelemetryState,
) => {
  if (state.generatedFromSeed) {
    seededHandKeys.add(state.handKey);
  }
};

const discardedCards = (dealtCards: readonly DealtCard[]) =>
  dealtCards.filter((dealtCard) => !dealtCard.kept);

export interface DiscardTelemetryProps {
  readonly consented: boolean | null;
  readonly dealtCards: readonly DealtCard[];
  // Only whether a seed exists crosses into telemetry; the seed value itself never does.
  readonly isSeededSession: boolean;
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
  isSeededSession,
  trackEvent,
  wasDeepLinked,
}: DiscardTelemetryProps): DiscardTelemetry => {
  const stateRef = useRef(
    createDealTelemetryState(dealtCards, {
      // A deep link supplies its own cards, so the seed did not generate them.
      generatedFromSeed: isSeededSession && !wasDeepLinked,
      handStartSource: wasDeepLinked ? "deeplink" : "initial",
      source: wasDeepLinked ? "deeplink" : "interactive",
    }),
  );
  const seededHandKeysRef = useRef(new Set<string>());
  useEffect(() => {
    rememberSeededHand(seededHandKeysRef.current, stateRef.current);
  }, []);
  const latestRef = useRef({ consented, trackEvent });
  useEffect(() => {
    latestRef.current = { consented, trackEvent };
  });
  const emit = useCallback(
    (eventName: TrainerEventName, params: TrainerEventParams) => {
      const latest = latestRef.current;
      latest.trackEvent(latest.consented, eventName, params);
      // Consent alone decides what actually reaches Google Analytics.
      // Callers that pair a later event need to know whether this one was sent.
      return latest.consented === true;
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
        generatedFromSeed: state.generatedFromSeed,
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
      if (!state.shown) {
        return;
      }
      if (state.shown.reported) {
        emit("analysis_unshown", {
          analysisIndex: state.shown.analysisIndex,
          dealNonce: state.dealNonce,
        });
      }
      state.shown = null;
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
      // Any earlier exposure of this deal's ranked answers ends first-instinct status.
      // Deep links, history hydration, and pre-consent selections all reveal them.
      const isFirstAnalysis =
        state.source === "interactive" && state.analysisCount === 1;
      const reported = emit("analysis_shown", {
        analysisIndex: state.analysisCount,
        dealNonce: state.dealNonce,
        generatedFromSeed: state.generatedFromSeed,
        isFirstAnalysis,
        source: state.source,
      });
      state.shown = {
        analysisIndex: state.analysisCount,
        discardKey,
        reported,
      };
    },
    [closeShownAnalysis, emit],
  );
  const replaceHand = useCallback(
    (newDealtCards: readonly DealtCard[], scope: HandScope) => {
      closeShownAnalysis(stateRef.current);
      const state = createDealTelemetryState(newDealtCards, scope);
      rememberSeededHand(seededHandKeysRef.current, state);
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
      const state = replaceHand(newDealtCards, {
        // A hand the user typed in is theirs, not the seed's, but typing one leaves the seeded generator untouched, so later deals are seed-derived again.
        generatedFromSeed: cause === "deal" && isSeededSession,
        handStartSource: cause,
        source: "interactive",
      });
      if (cause === "deal") {
        emit("deal_clicked", { dealNonce: state.dealNonce });
      }
      reportHandStarted(state);
      reportAnalysisState(state);
    },
    [
      emit,
      isSeededSession,
      replaceHand,
      reportAnalysisState,
      reportHandStarted,
    ],
  );
  const reportHistoryNavigation = useCallback(
    (newDealtCards: readonly DealtCard[]) => {
      const state = stateRef.current;
      const handKey = serializeHand(newDealtCards);
      if (handKey === state.handKey) {
        // Back/Forward within the same deal keeps the deal's nonce.
        state.source = "history";
        state.pendingCards = newDealtCards;
        reportAnalysisState(state);
      } else {
        const newState = replaceHand(newDealtCards, {
          generatedFromSeed: seededHandKeysRef.current.has(handKey),
          handStartSource: "history",
          source: "history",
        });
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
