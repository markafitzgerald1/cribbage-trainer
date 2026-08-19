/* jscpd:ignore-start */
import {
  HAND,
  type HistoryDestination,
  OTHER_HAND,
  type Scene,
  type SetupOptions,
  completeDiscard,
  deepLinkedOptions,
  eventParams,
  expectLastShown,
  expectTelemetryScene,
  handStartedEvents,
  handWithDiscards,
  navigateHistory,
  replaceHandWith,
  shownEvents,
  shownParams,
  toggleTo,
} from "./useDiscardTelemetry.test.common";
import type {
  HandStartSource,
  TrainerEventName,
  TrainerEventParams,
} from "../ui/trackEvent";
import { describe, expect, it } from "@jest/globals";
/* jscpd:ignore-end */

const unshownEvents = (scene: Scene) => eventParams(scene, "analysis_unshown");

const showThenHideAnalysis = (scene: Scene) => {
  completeDiscard(scene, "AH,2H");
  toggleTo(scene, "AH", true);
};

const replaceHand = (scene: Scene, cause: "deal" | "manual") => {
  replaceHandWith(scene, OTHER_HAND, cause);
};

const discardThenNavigate = (
  scene: Scene,
  discards: string,
  destination: HistoryDestination,
) => {
  completeDiscard(scene, discards);
  navigateHistory(scene, destination, null);
  return shownEvents(scene);
};

const cardParams = (discardCount: number) => ({
  dealNonce: expect.any(String),
  discardCount,
});

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
    generatedFromSeed: false,
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
  destination: HistoryDestination,
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
        {
          dealNonce: expect.any(String),
          generatedFromSeed: false,
          source: "initial",
        },
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
          generatedFromSeed: false,
          source: "deeplink",
        },
      ]);
    });
  });

  const exposeAnalysisThenConsent = (scene: Scene) => {
    completeDiscard(scene, "AH,2H");
    scene.rerenderConsent(true);
  };

  // Any earlier exposure of the ranked answers, transmitted or not, leaves the next analysis informed rather than a first instinct.
  const EARLIER_EXPOSURE_CASES: readonly {
    readonly expose?: (scene: Scene) => void;
    readonly name: string;
    readonly options: SetupOptions;
    readonly secondDiscard: string;
  }[] = [
    {
      expose: showThenHideAnalysis,
      name: "an earlier analysis of the hand was closed",
      options: {},
      secondDiscard: "AH,2H",
    },
    {
      name: "a deep link already revealed the answers",
      options: deepLinkedOptions,
      secondDiscard: "AH,3H",
    },
    {
      expose: exposeAnalysisThenConsent,
      name: "an exposure preceded consent",
      options: { consented: null },
      secondDiscard: "AH,3H",
    },
  ];

  it.each(EARLIER_EXPOSURE_CASES)(
    "indexes the next analysis second and denies first instinct when $name",
    ({ expose, options, secondDiscard }) => {
      expectTelemetryScene(options, (scene) => {
        expose?.(scene);
        completeDiscard(scene, secondDiscard);

        expectLastShown(scene, shownParams(2, false, "interactive"));
      });
    },
  );

  const consentedEventNames = (scene: Scene) =>
    scene.trackEvent.mock.calls
      .filter(([consented]) => consented === true)
      .map(([, eventName]) => eventName);

  it("never closes an analysis that consent kept off the wire", () => {
    expectTelemetryScene({ consented: null }, (scene) => {
      exposeAnalysisThenConsent(scene);
      toggleTo(scene, "AH", true);

      expect(consentedEventNames(scene)).toStrictEqual([
        "hand_started",
        "card_unselected",
      ]);
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
