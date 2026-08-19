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

// What a history entry has to store for a restore to know which hand it is returning to.
// Cards cannot serve as that identity: one seeded deal and a later hand-entry of the same six cards are two hands under one key.
export interface HistoryHandScope {
  readonly generatedFromSeed: boolean;
  readonly handId: string;
}

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
  hasRenderedAnalysis: boolean;
  readonly handStartSource: HandStartSource;
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
  handStartSource,
  handStarted: false,
  hasRenderedAnalysis: false,
  pendingCards: dealtCards,
  shown: null,
  source,
});

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
  readonly reportAnalysisRendered: () => void;
  readonly reportHistoryNavigation: (
    dealtCards: readonly DealtCard[],
    entry: HistoryHandScope | null,
  ) => void;
  // Callers stamp this onto the history entry they write and hand it back on a restore, so an entry states which hand it holds and where those cards came from.
  readonly currentHandScope: () => HistoryHandScope;
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
      // Only an exposure the user actually saw ends first-instinct status, so an analysis that never loaded leaves the next discard unaided.
      // Deep links, history hydration, and pre-consent selections all reveal the answers once they render.
      const isFirstAnalysis =
        state.source === "interactive" && !state.hasRenderedAnalysis;
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
  const reportAnalysisRendered = useCallback(() => {
    stateRef.current.hasRenderedAnalysis = true;
  }, []);
  const currentHandScope = useCallback(
    (): HistoryHandScope => ({
      generatedFromSeed: stateRef.current.generatedFromSeed,
      handId: stateRef.current.dealNonce,
    }),
    [],
  );
  const reportHistoryNavigation = useCallback(
    (newDealtCards: readonly DealtCard[], entry: HistoryHandScope | null) => {
      const state = stateRef.current;
      if (entry?.handId === state.dealNonce) {
        state.source = "history";
        state.pendingCards = newDealtCards;
        reportAnalysisState(state);
      } else {
        const newState = replaceHand(newDealtCards, {
          // An entry written before this document loaded states nothing, and a seeded session assumes its own seed there, which can only over-exclude.
          generatedFromSeed: entry?.generatedFromSeed ?? isSeededSession,
          handStartSource: "history",
          source: "history",
        });
        reportHandStarted(newState);
        reportAnalysisState(newState);
      }
    },
    [isSeededSession, replaceHand, reportAnalysisState, reportHandStarted],
  );
  useEffect(() => {
    // A deep-linked complete discard is reported after its first render.
    reportAnalysisState(stateRef.current);
  }, [reportAnalysisState]);
  return useMemo(
    () => ({
      currentHandScope,
      reportAnalysisRendered,
      reportCardToggled,
      reportHandReplaced,
      reportHistoryNavigation,
    }),
    [
      currentHandScope,
      reportAnalysisRendered,
      reportCardToggled,
      reportHandReplaced,
      reportHistoryNavigation,
    ],
  );
};
