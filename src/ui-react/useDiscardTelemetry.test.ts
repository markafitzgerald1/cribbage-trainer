import type {
  HandStartSource,
  TrackEvent,
  TrainerEventName,
  TrainerEventParams,
} from "../ui/trackEvent";
import { describe, expect, it, jest } from "@jest/globals";
import type { DealtCard } from "../game/DealtCard";
import { parseHand } from "../game/Card";
import { renderHook } from "@testing-library/react";
import { toDealtCards } from "../game/toDealtCards";
import { useDiscardTelemetry } from "./useDiscardTelemetry";

const HAND = "AH,2H,3H,4H,5H,6H";
const OTHER_HAND = "AS,2S,3S,4S,5S,6S";

const handWithDiscards = (hand: string, discards: string | null) =>
  toDealtCards(parseHand(hand), discards ? parseHand(discards) : null);

interface SetupOptions {
  readonly consented?: boolean | null;
  readonly dealtCards?: readonly DealtCard[];
  readonly wasDeepLinked?: boolean;
}

const setupTelemetry = ({
  consented = true,
  dealtCards = handWithDiscards(HAND, null),
  wasDeepLinked = false,
}: SetupOptions = {}) => {
  const trackEvent = jest.fn<TrackEvent>();
  const hook = renderHook(
    ({ currentConsent }: { readonly currentConsent: boolean | null }) =>
      useDiscardTelemetry({
        consented: currentConsent,
        dealtCards,
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

type Scene = ReturnType<typeof setupTelemetry>;

const expectTelemetryScene = (
  options: SetupOptions,
  run: (scene: Scene) => void,
) => {
  const scene = setupTelemetry(options);
  run(scene);
};

const eventParams = (scene: Scene, eventName: string) =>
  scene.trackEvent.mock.calls
    .filter(([, name]) => name === eventName)
    .map(([, , params]) => params);

const shownEvents = (scene: Scene) => eventParams(scene, "analysis_shown");

const unshownEvents = (scene: Scene) => eventParams(scene, "analysis_unshown");

const handStartedEvents = (scene: Scene) => eventParams(scene, "hand_started");

const toggleTo = (scene: Scene, discards: string | null, kept = false) => {
  scene.telemetry.reportCardToggled(handWithDiscards(HAND, discards), kept);
};

const completeDiscard = (scene: Scene, discards: string) => {
  toggleTo(scene, discards);
};

const showThenHideAnalysis = (scene: Scene) => {
  completeDiscard(scene, "AH,2H");
  toggleTo(scene, "AH", true);
};

const replaceHand = (scene: Scene, cause: "deal" | "manual") => {
  scene.telemetry.reportHandReplaced(handWithDiscards(OTHER_HAND, null), cause);
};

const navigateHistory = (scene: Scene, hand: string, discards: string) => {
  scene.telemetry.reportHistoryNavigation(handWithDiscards(hand, discards));
};

const discardThenNavigate = (
  scene: Scene,
  discards: string,
  destination: readonly [string, string],
) => {
  completeDiscard(scene, discards);
  navigateHistory(scene, destination[0], destination[1]);
  return shownEvents(scene);
};

const cardParams = (discardCount: number) => ({
  dealNonce: expect.any(String),
  discardCount,
});

const shownParams = (
  analysisIndex: number,
  isFirstAnalysis: boolean,
  source: string,
) => ({
  analysisIndex,
  dealNonce: expect.any(String),
  isFirstAnalysis,
  source,
});

const deepLinkedOptions: SetupOptions = {
  dealtCards: handWithDiscards(HAND, "AH,2H"),
  wasDeepLinked: true,
};

const expectCardEvent = (
  scene: Scene,
  eventName: TrainerEventName,
  discardCount: number,
) => {
  expect(scene.trackEvent).toHaveBeenLastCalledWith(
    true,
    eventName,
    cardParams(discardCount),
  );
};

const expectLastShown = (scene: Scene, expected: object) => {
  expect(shownEvents(scene).at(-1)).toStrictEqual(expected);
};

const expectTwoInteractiveAnalyses = (scene: Scene) => {
  expect(shownEvents(scene)).toStrictEqual([
    shownParams(1, true, "interactive"),
    shownParams(2, false, "interactive"),
  ]);
};

const expectFirstAnalysisUnshown = (scene: Scene) => {
  expect(unshownEvents(scene)).toStrictEqual([
    { analysisIndex: 1, dealNonce: expect.any(String) },
  ]);
};

const expectLastHandStarted = (
  scene: Scene,
  dealNonce: unknown,
  source: HandStartSource,
) => {
  expect(handStartedEvents(scene).at(-1)).toStrictEqual({
    dealNonce,
    source,
  });
};

const expectNewDealWithoutDealClick = (
  scene: Scene,
  first: TrainerEventParams | undefined,
  second: TrainerEventParams | undefined,
) => {
  expect(eventParams(scene, "deal_clicked")).toHaveLength(0);
  expect(second!.dealNonce).not.toBe(first!.dealNonce);
};

interface HistoryMoveEvents {
  readonly first: TrainerEventParams | undefined;
  readonly scene: Scene;
  readonly second: TrainerEventParams | undefined;
}

const expectHistoryMove = (
  destination: readonly [string, string],
  verify: (events: HistoryMoveEvents) => void,
) => {
  expectTelemetryScene({}, (scene) => {
    const [first, second] = discardThenNavigate(scene, "3H,6H", destination);
    verify({ first, scene, second });
  });
};

type ToggleStep = readonly [string | null, boolean];

const CARD_EVENT_CASES: readonly [
  TrainerEventName,
  number,
  readonly ToggleStep[],
][] = [
  ["card_selected", 1, [["3H", false]]],
  [
    "card_unselected",
    0,
    [
      ["3H", false],
      [null, true],
    ],
  ],
];

describe("useDiscardTelemetry", () => {
  it("starts the initial hand once consent is granted", () => {
    expectTelemetryScene({ consented: null }, (scene) => {
      expect(handStartedEvents(scene)).toHaveLength(0);

      scene.rerenderConsent(true);
      scene.rerenderConsent(true);

      expect(handStartedEvents(scene)).toStrictEqual([
        { dealNonce: expect.any(String), source: "initial" },
      ]);
    });
  });

  it.each(CARD_EVENT_CASES)(
    "emits %s immediately with the resulting discard count",
    (eventName, discardCount, toggles) => {
      expectTelemetryScene({}, (scene) => {
        toggles.forEach(([discards, kept]) => {
          toggleTo(scene, discards, kept);
        });

        expectCardEvent(scene, eventName, discardCount);
      });
    },
  );

  it("stamps only the first interactive analysis of a deal as first", () => {
    expectTelemetryScene({}, (scene) => {
      completeDiscard(scene, "AH,2H");
      completeDiscard(scene, "AH,3H");

      expect(unshownEvents(scene)).toHaveLength(0);

      expectTwoInteractiveAnalyses(scene);
    });
  });

  it("records a close and reopen when a flicker returns to a discard", () => {
    expectTelemetryScene({}, (scene) => {
      completeDiscard(scene, "2H,4H");
      toggleTo(scene, "2H,4H,5H");
      completeDiscard(scene, "2H,4H");

      expectTwoInteractiveAnalyses(scene);
      expectFirstAnalysisUnshown(scene);
    });
  });

  it("does not duplicate an analysis that remains shown", () => {
    expectTelemetryScene({}, (scene) => {
      ["2H,4H", "2H,4H"].forEach((discards) => {
        completeDiscard(scene, discards);
      });

      expect(shownEvents(scene)).toHaveLength(1);
    });
  });

  it("emits analysis_unshown when the state becomes incomplete", () => {
    expectTelemetryScene({}, (scene) => {
      showThenHideAnalysis(scene);

      expectFirstAnalysisUnshown(scene);
    });
  });

  it("re-indexes the same discard when it reopens after an unshown", () => {
    expectTelemetryScene({}, (scene) => {
      showThenHideAnalysis(scene);
      completeDiscard(scene, "AH,2H");

      expectLastShown(scene, shownParams(2, false, "interactive"));
    });
  });

  it("emits no analysis event for an incomplete initial state", () => {
    expectTelemetryScene({}, (scene) => {
      expect(shownEvents(scene)).toHaveLength(0);
      expect(unshownEvents(scene)).toHaveLength(0);
    });
  });

  it("closes the shown analysis and resets the nonce on a deal", () => {
    expectTelemetryScene({}, (scene) => {
      completeDiscard(scene, "5H,6H");
      replaceHand(scene, "deal");
      const [shown] = shownEvents(scene);
      const [dealt] = eventParams(scene, "deal_clicked");

      expect(unshownEvents(scene)).toStrictEqual([
        { analysisIndex: 1, dealNonce: shown!.dealNonce },
      ]);
      expect(dealt!.dealNonce).not.toBe(shown!.dealNonce);

      expectLastHandStarted(scene, dealt!.dealNonce, "deal");
    });
  });

  it("resets the nonce without deal_clicked for a manual hand", () => {
    expectTelemetryScene({}, (scene) => {
      toggleTo(scene, "4H");
      replaceHand(scene, "manual");
      scene.telemetry.reportCardToggled(
        handWithDiscards(OTHER_HAND, "AS"),
        false,
      );
      const [first, second] = eventParams(scene, "card_selected");

      expectNewDealWithoutDealClick(scene, first, second);

      expectLastHandStarted(scene, second!.dealNonce, "manual");
    });
  });

  it("keeps the deal nonce for a history move within the same hand", () => {
    expectHistoryMove([HAND, "4H,6H"], ({ first, scene, second }) => {
      expect(second).toStrictEqual({
        ...shownParams(2, false, "history"),
        dealNonce: first!.dealNonce,
      });
      expect(handStartedEvents(scene)).toHaveLength(1);
    });
  });

  it("starts a new deal for a history move to a different hand", () => {
    expectHistoryMove([OTHER_HAND, "AS,2S"], ({ first, scene, second }) => {
      expect(unshownEvents(scene)).toHaveLength(1);
      expect(second).toStrictEqual(shownParams(1, false, "history"));

      expectNewDealWithoutDealClick(scene, first, second);

      expectLastHandStarted(scene, second!.dealNonce, "history");
    });
  });

  it("emits a deep-linked analysis as non-first after mount", () => {
    expectTelemetryScene(deepLinkedOptions, (scene) => {
      expect(shownEvents(scene)).toStrictEqual([
        shownParams(1, false, "deeplink"),
      ]);
      expect(handStartedEvents(scene)).toStrictEqual([
        {
          dealNonce: shownEvents(scene)[0]!.dealNonce,
          source: "deeplink",
        },
      ]);
    });
  });

  it("marks the first interactive analysis after a deep link as first", () => {
    expectTelemetryScene(deepLinkedOptions, (scene) => {
      completeDiscard(scene, "AH,3H");

      expectLastShown(scene, shownParams(2, true, "interactive"));
    });
  });

  it("forwards the latest consent value to trackEvent", () => {
    expectTelemetryScene({ consented: null }, (scene) => {
      toggleTo(scene, "2H");

      expect(scene.trackEvent).toHaveBeenLastCalledWith(
        null,
        "card_selected",
        expect.any(Object),
      );
    });
  });
});
