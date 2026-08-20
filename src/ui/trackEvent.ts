import type { CribRole } from "../game/expectedCribPoints";
import type { DiscardQuality } from "../analysis/discardQuality";
import { gtag } from "./gtag";

export type AnalysisSource = "deeplink" | "history" | "interactive";

export type HandStartSource =
  "deal" | "deeplink" | "history" | "initial" | "manual";

// Payloads stay card-free: counts, indices, source, provenance, and the per-hand nonce only.
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
  // The quality fields come from the shared derivation rather than being restated here, so the wire contract cannot drift from what the trainer measured.
  readonly discard_scored: DiscardQuality & {
    readonly analysisIndex: number;
    readonly cribRole: CribRole;
    readonly dealNonce: string;
    readonly generatedFromSeed: boolean;
    // Where the hand itself came from, which `source` does not say: a typed-in hand reaches its first discard as an ordinary interactive one, and only this separates practice from population play.
    readonly handStartSource: HandStartSource;
    readonly isFirstAnalysis: boolean;
    // Explicit, so an export stays interpretable once these parameters change.
    readonly schemaVersion: number;
    readonly source: AnalysisSource;
  };
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

export type CardToggleEventName = "card_selected" | "card_unselected";

// Raised whenever the decision-quality payload's meaning changes, never for an unrelated event.
export const DISCARD_SCORED_SCHEMA_VERSION = 1;

type TrainerEventParamKey = {
  [Name in TrainerEventName]: keyof TrainerEventParamsByName[Name];
}[TrainerEventName];

// Banned rather than absent, because a larger payload structurally satisfies a smaller one: analysis_shown would pass as deal_clicked, surplus fields and all.
type WithoutOtherParams<Params> = Params & {
  readonly [Key in Exclude<TrainerEventParamKey, keyof Params>]?: never;
};

export type TrainerEventParams<
  Name extends TrainerEventName = TrainerEventName,
> = WithoutOtherParams<TrainerEventParamsByName[Name]>;

// A tuple rather than a generic pair, which infers the name as the whole union once a caller holds a widened one, losing the link to the payload.
export type TrainerEvent = {
  [Name in TrainerEventName]: readonly [Name, TrainerEventParams<Name>];
}[TrainerEventName];

export type TrackEvent = (
  consented: boolean | null,
  ...event: TrainerEvent
) => void;

// The types above cannot survive a payload built by spreading, Object.assign, or a cast, and Object.entries would forward whatever such a payload carried, so the send path filters against this list too.
// Entries rather than an object keyed by event name, whose snake_case keys would each need a camelcase exemption.
type EventParamKeyEntry = {
  [Name in TrainerEventName]: readonly [
    Name,
    readonly (keyof TrainerEventParamsByName[Name])[],
  ];
}[TrainerEventName];

const eventParamKeys = [
  [
    "analysis_shown",
    [
      "analysisIndex",
      "dealNonce",
      "generatedFromSeed",
      "isFirstAnalysis",
      "source",
    ],
  ],
  ["analysis_unshown", ["analysisIndex", "dealNonce"]],
  ["card_selected", ["dealNonce", "discardCount"]],
  ["card_unselected", ["dealNonce", "discardCount"]],
  ["deal_clicked", ["dealNonce"]],
  [
    "discard_scored",
    [
      "analysisIndex",
      "cribRole",
      "dealNonce",
      "expectedPointsLoss",
      "generatedFromSeed",
      "handStartSource",
      "isFirstAnalysis",
      "isOptimal",
      "schemaVersion",
      "source",
    ],
  ],
  ["hand_started", ["dealNonce", "generatedFromSeed", "source"]],
] as const satisfies readonly EventParamKeyEntry[];

// An unlisted event would send nothing at all, so its absence fails the build here instead, exported only because a local type nothing reads is itself an error.
type AssertNever<Name extends never> = Name;
export type EveryEventIsListed = AssertNever<
  Exclude<TrainerEventName, (typeof eventParamKeys)[number][0]>
>;

// Exported so a spec can prove its own event coverage against this list rather than a second one.
export const trainerEventNames: readonly TrainerEventName[] =
  eventParamKeys.map(([name]) => name);

// Filtered rather than looked up, since a lookup needs a fallback branch that can never run.
const allowedParamKeys = (eventName: TrainerEventName): readonly string[] =>
  eventParamKeys
    .filter(([name]) => name === eventName)
    .flatMap(([, keys]) => keys as readonly string[]);

// Exported so a spec can state expected payloads without restating this conversion.
export const toGoogleAnalyticsKey = (key: string) =>
  key.replace(/[A-Z]/gu, (upper) => `_${upper.toLowerCase()}`);

// This gate prevents events before Google Analytics loads or after withdrawal.
export const trackEvent: TrackEvent = (consented, ...event) => {
  if (consented !== true) {
    return;
  }
  // Taken apart here rather than named as parameters, which widens the pair back into independent types.
  const [eventName, params] = event;
  const allowedKeys = allowedParamKeys(eventName);
  gtag(
    "event",
    eventName,
    Object.fromEntries(
      Object.entries(params)
        .filter(([key]) => allowedKeys.includes(key))
        .map(([key, value]) => [toGoogleAnalyticsKey(key), value]),
    ),
  );
};
