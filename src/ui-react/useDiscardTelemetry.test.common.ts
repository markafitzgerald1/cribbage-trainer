/* jscpd:ignore-start */
import {
  type HistoryHandScope,
  useDiscardTelemetry,
} from "./useDiscardTelemetry";
import { expect, jest } from "@jest/globals";
import type { DealtCard } from "../game/DealtCard";
import type { TrackEvent } from "../ui/trackEvent";
import { parseHand } from "../game/Card";
import { renderHook } from "@testing-library/react";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

export const HAND = "AH,2H,3H,4H,5H,6H";
export const OTHER_HAND = "AS,2S,3S,4S,5S,6S";

export const handWithDiscards = (hand: string, discards: string | null) =>
  toDealtCards(parseHand(hand), discards ? parseHand(discards) : null);

export interface SetupOptions {
  readonly consented?: boolean | null;
  readonly dealtCards?: readonly DealtCard[];
  readonly isSeededSession?: boolean;
  readonly wasDeepLinked?: boolean;
}

const setupTelemetry = ({
  consented = true,
  dealtCards = handWithDiscards(HAND, null),
  isSeededSession = false,
  wasDeepLinked = false,
}: SetupOptions = {}) => {
  const trackEvent = jest.fn<TrackEvent>();
  const hook = renderHook(
    ({ currentConsent }: { readonly currentConsent: boolean | null }) =>
      useDiscardTelemetry({
        consented: currentConsent,
        dealtCards,
        isSeededSession,
        trackEvent,
        wasDeepLinked,
      }),
    { initialProps: { currentConsent: consented } },
  );
  return {
    rerenderConsent: (currentConsent: boolean | null) => {
      hook.rerender({ currentConsent });
    },
    telemetry: hook.result.current,
    trackEvent,
  };
};

export type Scene = ReturnType<typeof setupTelemetry>;

export const expectTelemetryScene = (
  options: SetupOptions,
  run: (scene: Scene) => void,
) => {
  const scene = setupTelemetry(options);
  run(scene);
};

export const eventParams = (scene: Scene, eventName: string) =>
  scene.trackEvent.mock.calls
    .filter(([, name]) => name === eventName)
    .map(([, , params]) => params);

export const shownEvents = (scene: Scene) =>
  eventParams(scene, "analysis_shown");

export const handStartedEvents = (scene: Scene) =>
  eventParams(scene, "hand_started");

export const toggleTo = (
  scene: Scene,
  discards: string | null,
  kept = false,
) => {
  scene.telemetry.reportCardToggled(handWithDiscards(HAND, discards), kept);
};

// What ScoredPossibleKeepDiscards reports once ranked results are on screen.
export const revealAnalysis = (scene: Scene) => {
  scene.telemetry.reportAnalysisRendered();
};

export const completeDiscard = (scene: Scene, discards: string) => {
  toggleTo(scene, discards);
};

export const replaceHandWith = (
  scene: Scene,
  hand: string,
  cause: "deal" | "manual",
) => {
  scene.telemetry.reportHandReplaced(handWithDiscards(hand, null), cause);
};

export type HistoryDestination = readonly [string, string | null];

export const navigateHistory = (
  scene: Scene,
  [hand, discards]: HistoryDestination,
  entry: HistoryHandScope | null,
) => {
  scene.telemetry.reportHistoryNavigation(
    handWithDiscards(hand, discards),
    entry,
  );
};

// A restore of the hand on screen carries the entry the app stamped while that hand was current.
export const currentEntry = (scene: Scene) =>
  scene.telemetry.currentHandScope();

// An entry recording provenance but belonging to some other hand, which is every restore that leaves the current hand.
export const entryFrom = (generatedFromSeed: boolean): HistoryHandScope => ({
  generatedFromSeed,
  handId: "other-hand",
});

export const shownParams = (
  analysisIndex: number,
  isFirstAnalysis: boolean,
  source: string,
) => ({
  analysisIndex,
  dealNonce: expect.any(String),
  generatedFromSeed: false,
  isFirstAnalysis,
  source,
});

export const deepLinkedOptions: SetupOptions = {
  dealtCards: handWithDiscards(HAND, "AH,2H"),
  wasDeepLinked: true,
};

export const expectLastShown = (scene: Scene, expected: object) => {
  expect(shownEvents(scene).at(-1)).toStrictEqual(expected);
};
