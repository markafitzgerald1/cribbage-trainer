import {
  type AnalysisSource,
  DISCARD_SCORED_SCHEMA_VERSION,
  type HandStartSource,
  type TrackEvent,
  type TrainerEvent,
} from "../ui/trackEvent";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { DiscardQuality } from "../analysis/discardQuality";
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
  // Stamped from the exposure rather than read again when the answers render, because rendering them is what ends first-instinct status.
  readonly isFirstAnalysis: boolean;
  /*
   * Stamped when the exposure opens, not read when its score arrives: the
   * decision was made under this answer, and consent is not retroactive.
   * Reading it later would also make collection depend on how long the tables
   * took to load, and could ship a score for an exposure Google Analytics
   * never saw begin — the same pairing analysis_unshown keeps.
   */
  readonly qualityConsented: boolean;
  qualityReported: boolean;
  // Stamped like the flag above, because the hand's source can change after this exposure opens: a history move onto the same discard keeps the exposure while making the state history-sourced, and the score must not disagree with the analysis_shown it belongs to.
  readonly source: AnalysisSource;
  // An exposure that consent kept off the wire must also close silently.
  // Otherwise Google Analytics receives an unshown whose shown it never saw.
  readonly reported: boolean;
}

// What the analysis component saw on screen: the role it scored against, and what the discard gave up, which is absent until two cards are discarded.
export interface RenderedAnalysis {
  readonly cribRole: CribRole;
  readonly quality: DiscardQuality | null;
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
  // Held when answers reach the screen before the exposure that reports them exists, which is the order effects run in on a deep-linked first render.
  pendingAnalysis: RenderedAnalysis | null;
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
  pendingAnalysis: null,
  pendingCards: dealtCards,
  shown: null,
  source,
});

const discardedCards = (dealtCards: readonly DealtCard[]) =>
  dealtCards.filter((dealtCard) => !dealtCard.kept);

export interface DiscardTelemetryProps {
  readonly consented: boolean | null;
  readonly dealtCards: readonly DealtCard[];
  // Decision-quality collection is disclosed by a policy version of its own, so it can be withheld while the rest of the events keep flowing under the consent already given.
  readonly decisionQualityConsented: boolean;
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
  readonly reportAnalysisRendered: (analysis: RenderedAnalysis) => void;
  readonly reportHistoryNavigation: (
    dealtCards: readonly DealtCard[],
    entry: HistoryHandScope | null,
  ) => void;
  // Callers stamp this onto the history entry they write and hand it back on a restore, so an entry states which hand it holds and where those cards came from.
  readonly currentHandScope: () => HistoryHandScope;
}

// GA4 cannot reconstruct "first analysis exposure per deal" after the fact, so the per-deal nonce, 1-based analysis index, and first-interactive flag are stamped at emit time.
// Only the first render's `dealtCards` is read here; later states arrive through the report methods.
// Timer and interaction callbacks read consent when they fire, not when they were created, so the latest values live in a ref rather than in each callback's closure.
const useEventEmitter = (
  consented: boolean | null,
  decisionQualityConsented: boolean,
  trackEvent: TrackEvent,
) => {
  const latestRef = useRef({ consented, decisionQualityConsented, trackEvent });
  useEffect(() => {
    latestRef.current = { consented, decisionQualityConsented, trackEvent };
  });
  const send = useCallback(
    (sendConsent: boolean | null, ...event: TrainerEvent) => {
      latestRef.current.trackEvent(sendConsent, ...event);
      // Consent alone decides what actually reaches Google Analytics.
      // Callers that pair a later event need to know whether this one was sent.
      return sendConsent === true;
    },
    [],
  );
  const emit = useCallback(
    (...event: TrainerEvent) => send(latestRef.current.consented, ...event),
    [send],
  );
  const hasConsent = useCallback(
    () => latestRef.current.consented === true,
    [],
  );
  const hasDecisionQualityConsent = useCallback(
    () => latestRef.current.decisionQualityConsented,
    [],
  );
  return { emit, emitAs: send, hasConsent, hasDecisionQualityConsent };
};

export const useDiscardTelemetry = ({
  consented,
  dealtCards,
  decisionQualityConsented,
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
  const { emit, emitAs, hasConsent, hasDecisionQualityConsent } =
    useEventEmitter(consented, decisionQualityConsented, trackEvent);
  const reportHandStarted = useCallback(
    (state: DealTelemetryState) => {
      if (state.handStarted || !hasConsent()) {
        return;
      }
      state.handStarted = true;
      emit("hand_started", {
        dealNonce: state.dealNonce,
        generatedFromSeed: state.generatedFromSeed,
        source: state.handStartSource,
      });
    },
    [emit, hasConsent],
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
  const reportDiscardScored = useCallback(
    (
      state: DealTelemetryState,
      shown: ShownAnalysis,
      { cribRole, quality }: RenderedAnalysis,
    ) => {
      if (shown.qualityReported || !quality) {
        return;
      }
      shown.qualityReported = true;
      emitAs(shown.qualityConsented, "discard_scored", {
        analysisIndex: shown.analysisIndex,
        cribRole,
        dealNonce: state.dealNonce,
        generatedFromSeed: state.generatedFromSeed,
        handStartSource: state.handStartSource,
        isFirstAnalysis: shown.isFirstAnalysis,
        schemaVersion: DISCARD_SCORED_SCHEMA_VERSION,
        source: shown.source,
        // Spread from the derivation's own type rather than a widened record, so every quality field still type-checks against the event's payload.
        ...quality,
      });
    },
    [emitAs],
  );
  const reportAnalysisState = useCallback(
    (state: DealTelemetryState) => {
      if (!discardIsComplete(state.pendingCards)) {
        // An analysis of a discard that is no longer complete must not attach itself to the next exposure.
        state.pendingAnalysis = null;
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
      const shown = {
        analysisIndex: state.analysisCount,
        discardKey,
        isFirstAnalysis,
        qualityConsented: hasDecisionQualityConsent(),
        qualityReported: false,
        reported,
        source: state.source,
      };
      state.shown = shown;
      const { pendingAnalysis } = state;
      state.pendingAnalysis = null;
      if (pendingAnalysis) {
        reportDiscardScored(state, shown, pendingAnalysis);
      }
    },
    [closeShownAnalysis, emit, hasDecisionQualityConsent, reportDiscardScored],
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
      // The event that opens a hand scope is the first one carrying its identifier, so deal_clicked follows the scope it caused rather than preceding it.
      reportHandStarted(state);
      if (cause === "deal") {
        emit("deal_clicked", { dealNonce: state.dealNonce });
      }
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
  const reportAnalysisRendered = useCallback(
    (analysis: RenderedAnalysis) => {
      const state = stateRef.current;
      state.hasRenderedAnalysis = true;
      if (state.shown) {
        reportDiscardScored(state, state.shown, analysis);
      } else {
        state.pendingAnalysis = analysis;
      }
    },
    [reportDiscardScored],
  );
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
