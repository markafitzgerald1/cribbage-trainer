import {
  type TrainerEvent,
  toGoogleAnalyticsKey,
  trackEvent,
  trainerEventNames,
} from "./trackEvent";
import { describe, expect, it } from "@jest/globals";

describe("trackEvent", () => {
  const setupDataLayer = () => {
    window.dataLayer = [];
    return window.dataLayer;
  };

  it.each([null, false])(
    "pushes nothing to the data layer when consent is %s",
    (consented) => {
      const dataLayer = setupDataLayer();

      trackEvent(consented, "card_selected", {
        dealNonce: "nonce",
        discardCount: 1,
      });

      expect(dataLayer).toHaveLength(0);
    },
  );

  it("does not throw when consented before the data layer exists", () => {
    delete window.dataLayer;

    expect(() => {
      trackEvent(true, "deal_clicked", { dealNonce: "nonce" });
    }).not.toThrow();
  });

  const FULL_PAYLOADS = [
    [
      "analysis_shown",
      {
        analysisIndex: 1,
        dealNonce: "n",
        generatedFromSeed: false,
        isFirstAnalysis: true,
        source: "interactive",
      },
    ],
    ["analysis_unshown", { analysisIndex: 2, dealNonce: "n" }],
    ["card_selected", { dealNonce: "n", discardCount: 1 }],
    ["card_unselected", { dealNonce: "n", discardCount: 0 }],
    ["deal_clicked", { dealNonce: "n" }],
    [
      "discard_scored",
      {
        analysisIndex: 1,
        cribRole: "Dealer",
        dealNonce: "n",
        expectedPointsLoss: 1.25,
        expectedPointsLossBucket: "1-2",
        generatedFromSeed: false,
        handStartSource: "deal",
        isFirstAnalysis: true,
        isOptimal: false,
        schemaVersion: 1,
        source: "interactive",
      },
    ],
    [
      "hand_started",
      { dealNonce: "n", generatedFromSeed: true, source: "deal" },
    ],
  ] as const satisfies readonly TrainerEvent[];

  const sentParams = (dataLayer: readonly unknown[]) =>
    Array.from(dataLayer[0] as IArguments)[2] as Record<string, unknown>;

  const sendAndCapture = (event: TrainerEvent) => {
    const dataLayer = setupDataLayer();
    trackEvent(true, ...event);
    return sentParams(dataLayer);
  };

  // Spread rather than taken apart, because splitting the pair widens the name and the payload independently, which the event type exists to prevent.
  it("covers every event this module can send", () => {
    expect(FULL_PAYLOADS.map(([eventName]) => eventName)).toStrictEqual(
      trainerEventNames,
    );
  });

  it("sends every parameter each event declares", () => {
    const sentCounts = FULL_PAYLOADS.map(
      (event) => Object.keys(sendAndCapture(event)).length,
    );

    expect(sentCounts).toStrictEqual(
      FULL_PAYLOADS.map((event) => Object.keys(event[1]).length),
    );
  });

  // A payload built from a widened source defeats the declared types, so the runtime keeps its own list — and it has to be exact rather than a superset, since anything it lets through reaches Google Analytics under an event that never declared it.
  it("sends an event only the parameters it declares", () => {
    const everyParam = {
      analysisIndex: 9,
      cribRole: "Pone",
      dealNonce: "n",
      discardCount: 4,
      expectedPointsLoss: 0.5,
      expectedPointsLossBucket: "0.5-1",
      generatedFromSeed: true,
      handStartSource: "manual",
      isFirstAnalysis: true,
      isOptimal: true,
      schemaVersion: 1,
      source: "deal",
    };
    const sent = FULL_PAYLOADS.map((event) =>
      sendAndCapture([event[0], everyParam] as unknown as TrainerEvent),
    );

    expect(sent).toStrictEqual(
      FULL_PAYLOADS.map(([, declared]) =>
        Object.fromEntries(
          Object.keys(declared).map((key) => [
            toGoogleAnalyticsKey(key),
            everyParam[key as keyof typeof everyParam],
          ]),
        ),
      ),
    );
  });

  it("pushes a gtag event with snake_case parameter keys when consented", () => {
    const dataLayer = setupDataLayer();

    trackEvent(true, "analysis_shown", {
      analysisIndex: 1,
      dealNonce: "nonce",
      generatedFromSeed: false,
      isFirstAnalysis: true,
      source: "interactive",
    });

    expect(Array.from(dataLayer[0] as IArguments)).toStrictEqual([
      "event",
      "analysis_shown",
      {
        // eslint-disable-next-line camelcase
        analysis_index: 1,
        // eslint-disable-next-line camelcase
        deal_nonce: "nonce",
        // eslint-disable-next-line camelcase
        generated_from_seed: false,
        // eslint-disable-next-line camelcase
        is_first_analysis: true,
        source: "interactive",
      },
    ]);
  });
});
