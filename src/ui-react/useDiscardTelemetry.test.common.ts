/* jscpd:ignore-start */
import {
  type HistoryHandScope,
  useDiscardTelemetry,
} from "./useDiscardTelemetry";
import type {
  TrackEvent,
  TrainerEventName,
  TrainerEventParams,
} from "../ui/trackEvent";
import { expect, jest } from "@jest/globals";
import type { DealtCard } from "../game/DealtCard";
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

type TrackEventCall<Name extends TrainerEventName> = readonly [
  boolean | null,
  Name,
  TrainerEventParams<Name>,
];

function isCallOf<Name extends TrainerEventName>(
  call: readonly unknown[],
  eventName: Name,
): call is TrackEventCall<Name> {
  return call[1] === eventName;
}

export function eventParams<Name extends TrainerEventName>(
  scene: Scene,
  eventName: Name,
): readonly TrainerEventParams<Name>[] {
  return scene.trackEvent.mock.calls
    .filter((call) => isCallOf(call, eventName))
    .map(([, , params]) => params);
}

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

export const renderAnalysisOnScreen = (scene: Scene) => {
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

export const entryForCurrentHand = (scene: Scene) =>
  scene.telemetry.currentHandScope();

export const entryForAnotherHand = (
  generatedFromSeed: boolean,
): HistoryHandScope => ({
  generatedFromSeed,
  handId: "another-hand",
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
