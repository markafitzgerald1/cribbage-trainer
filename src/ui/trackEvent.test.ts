import { type TrainerEvent, trackEvent } from "./trackEvent";
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
      "hand_started",
      { dealNonce: "n", generatedFromSeed: true, source: "deal" },
    ],
  ] as const satisfies readonly TrainerEvent[];

  const sentParams = (dataLayer: readonly unknown[]) =>
    Array.from(dataLayer[0] as IArguments)[2] as Record<string, unknown>;

  // Spread rather than taken apart, because splitting the pair widens the name and the payload independently, which the event type exists to prevent.
  it("sends every parameter each event declares", () => {
    const sentCounts = FULL_PAYLOADS.map((event) => {
      const dataLayer = setupDataLayer();
      trackEvent(true, ...event);
      return Object.keys(sentParams(dataLayer)).length;
    });

    expect(sentCounts).toStrictEqual(
      FULL_PAYLOADS.map((event) => Object.keys(event[1]).length),
    );
  });

  // A payload built from a widened source defeats the declared types, so the runtime keeps its own list.
  it("drops a parameter the event does not declare", () => {
    const dataLayer = setupDataLayer();
    const smuggled = { analysisIndex: 3 } as Record<string, unknown>;

    trackEvent(true, "deal_clicked", {
      dealNonce: "n",
      ...smuggled,
    });

    expect(sentParams(dataLayer)).toStrictEqual({
      // eslint-disable-next-line camelcase
      deal_nonce: "n",
    });
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
