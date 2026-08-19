import { gtag } from "./gtag";

export type AnalysisSource = "deeplink" | "history" | "interactive";

export type HandStartSource =
  "deal" | "deeplink" | "history" | "initial" | "manual";

// One entry per event, so a parameter an event does not carry cannot be passed to it.
// Every payload stays card-free by construction: counts, indices, source, provenance, and the per-hand nonce only.
interface TrainerEventParamsByName {
  readonly analysis_shown: {
    readonly analysisIndex: number;
    readonly dealNonce: string;
    // Low-cardinality provenance, never the seed itself or anything derived from it.
    readonly generatedFromSeed: boolean;
    readonly isFirstAnalysis: boolean;
    readonly source: AnalysisSource;
  };
  readonly analysis_unshown: {
    readonly analysisIndex: number;
    readonly dealNonce: string;
  };
  readonly card_selected: DiscardCountParams;
  readonly card_unselected: DiscardCountParams;
  readonly deal_clicked: { readonly dealNonce: string };
  readonly hand_started: {
    readonly dealNonce: string;
    readonly generatedFromSeed: boolean;
    readonly source: HandStartSource;
  };
}

interface DiscardCountParams {
  readonly dealNonce: string;
  readonly discardCount: number;
}

export type TrainerEventName = keyof TrainerEventParamsByName;

export type TrainerEventParams<
  Name extends TrainerEventName = TrainerEventName,
> = TrainerEventParamsByName[Name];

export type TrackEvent = <Name extends TrainerEventName>(
  consented: boolean | null,
  eventName: Name,
  params: TrainerEventParams<Name>,
) => void;

const toGoogleAnalyticsKey = (key: string) =>
  key.replace(/[A-Z]/gu, (upper) => `_${upper.toLowerCase()}`);

// This gate prevents events before Google Analytics loads or after withdrawal.
export const trackEvent: TrackEvent = (consented, eventName, params) => {
  if (consented !== true) {
    return;
  }
  gtag(
    "event",
    eventName,
    Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        toGoogleAnalyticsKey(key),
        value,
      ]),
    ),
  );
};
