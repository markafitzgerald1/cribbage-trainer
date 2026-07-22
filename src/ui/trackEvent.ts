import { gtag } from "./gtag";

export type AnalysisSource = "deeplink" | "history" | "interactive";

export type HandStartSource =
  "deal" | "deeplink" | "history" | "initial" | "manual";

export type TrainerEventName =
  | "analysis_shown"
  | "analysis_unshown"
  | "card_selected"
  | "card_unselected"
  | "deal_clicked"
  | "hand_started";

// Concrete keys keep every payload card-free by construction: counts, indices, source, and the per-deal nonce only.
export interface TrainerEventParams {
  readonly analysisIndex?: number;
  readonly dealNonce?: string;
  readonly discardCount?: number;
  readonly isFirstAnalysis?: boolean;
  readonly source?: AnalysisSource | HandStartSource;
}

export type TrackEvent = (
  consented: boolean | null,
  eventName: TrainerEventName,
  params: TrainerEventParams,
) => void;

const toGoogleAnalyticsKey = (key: string) =>
  key.replace(/[A-Z]/gu, (upper) => `_${upper.toLowerCase()}`);

// Basic consent mode keeps the Google tag unloaded until consent.
// The app-level gate also prevents trainer events while consent is unanswered or declined.
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
