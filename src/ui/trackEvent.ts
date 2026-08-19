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

// The two events a card toggle can produce, named so callers can say which pair they mean.
export type CardToggleEventName = "card_selected" | "card_unselected";

// Every parameter any event can carry, derived rather than listed so a new one joins automatically.
type TrainerEventParamKey = {
  [Name in TrainerEventName]: keyof TrainerEventParamsByName[Name];
}[TrainerEventName];

// Structural typing alone would let a payload with surplus fields stand in for a smaller one — an analysis_shown payload satisfies deal_clicked, and Object.entries would forward the surplus to Google Analytics — so every parameter an event does not carry is banned rather than merely absent.
type WithoutOtherParams<Params> = Params & {
  readonly [Key in Exclude<TrainerEventParamKey, keyof Params>]?: never;
};

export type TrainerEventParams<
  Name extends TrainerEventName = TrainerEventName,
> = WithoutOtherParams<TrainerEventParamsByName[Name]>;

// A tuple union rather than a generic pair, because a generic infers the name as the whole union whenever a caller holds a widened name, which would re-admit an analysis_shown payload sent under a hand_started name.
export type TrainerEvent = {
  [Name in TrainerEventName]: readonly [Name, TrainerEventParams<Name>];
}[TrainerEventName];

export type TrackEvent = (
  consented: boolean | null,
  ...event: TrainerEvent
) => void;

// The parameters each event may send, enforced at runtime because no type survives a payload built from a widened source: a spread of Record<string, unknown>, an Object.assign, or a cast all defeat the declarations above, and whatever they smuggle in would reach Google Analytics as a real parameter.
// Entries rather than an object keyed by event name, since those names are snake_case and would each need a camelcase exemption as literal keys.
type EventParamKeys = {
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
  ["hand_started", ["dealNonce", "generatedFromSeed", "source"]],
] as const satisfies readonly EventParamKeys[];

// An event with no entry above would send nothing at all, so its absence has to be a compile error rather than a silent runtime strip.
// Exported because it exists only to be checked: an unlisted event makes this fail to satisfy `extends never`, and a local type nothing reads is itself an error.
type AssertNever<Name extends never> = Name;
export type EveryEventIsListed = AssertNever<
  Exclude<TrainerEventName, (typeof eventParamKeys)[number][0]>
>;

// Exported so a test can prove its own event coverage against the same list.
export const trainerEventNames: readonly TrainerEventName[] =
  eventParamKeys.map(([name]) => name);

// Filtered rather than looked up, so a name with no entry yields nothing to send instead of a branch that can never run.
const allowedParamKeys = (eventName: TrainerEventName): readonly string[] =>
  eventParamKeys
    .filter(([name]) => name === eventName)
    .flatMap(([, keys]) => keys as readonly string[]);

// Exported so a spec can state expected payloads in the keys Google Analytics actually receives, without restating this conversion.
export const toGoogleAnalyticsKey = (key: string) =>
  key.replace(/[A-Z]/gu, (upper) => `_${upper.toLowerCase()}`);

// This gate prevents events before Google Analytics loads or after withdrawal.
export const trackEvent: TrackEvent = (consented, ...event) => {
  if (consented !== true) {
    return;
  }
  // Taken apart here rather than named as parameters, since naming them widens the pair back into independent name and payload types.
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
