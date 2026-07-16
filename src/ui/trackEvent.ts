import { gtag } from "./gtag";

export type AnalysisSource = "deeplink" | "history" | "interactive";

export type TrainerEventName =
  | "analysis_shown"
  | "analysis_unshown"
  | "card_selected"
  | "card_unselected"
  | "deal_clicked";

// Concrete keys keep every payload card-free by construction: counts, indices, source, and the per-deal nonce only.
export interface TrainerEventParams {
  readonly analysisIndex?: number;
  readonly dealNonce?: string;
  readonly discardCount?: number;
  readonly isFirstAnalysis?: boolean;
  readonly source?: AnalysisSource;
}

export type TrackEvent = (
  consented: boolean | null,
  eventName: TrainerEventName,
  params: TrainerEventParams,
) => void;

const toGoogleAnalyticsKey = (key: string) =>
  key.replace(/[A-Z]/gu, (upper) => `_${upper.toLowerCase()}`);

// GA consent-mode "denied" still sends cookieless pings, so consent mode alone cannot satisfy "no events fire unless consented".
// Every event is therefore gated app-side on an explicit consented === true.
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
