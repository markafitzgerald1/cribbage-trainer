import { describe, expect, it } from "@jest/globals";
import { trackEvent } from "./trackEvent";

describe("trackEvent", () => {
  const setupDataLayer = () => {
    window.dataLayer = [];
    return window.dataLayer;
  };

  it.each([null, false])(
    "pushes nothing to the data layer when consent is %s",
    (consented) => {
      const dataLayer = setupDataLayer();

      trackEvent(consented, "card_selected", { dealNonce: "nonce" });

      expect(dataLayer).toHaveLength(0);
    },
  );

  it("does not throw when consented before the data layer exists", () => {
    delete window.dataLayer;

    expect(() => {
      trackEvent(true, "deal_clicked", { dealNonce: "nonce" });
    }).not.toThrow();
  });

  it("pushes a gtag event with snake_case parameter keys when consented", () => {
    const dataLayer = setupDataLayer();

    trackEvent(true, "analysis_shown", {
      analysisIndex: 1,
      dealNonce: "nonce",
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
        is_first_analysis: true,
        source: "interactive",
      },
    ]);
  });
});
