import { describe, expect, it, jest } from "@jest/globals";
import { loadGoogleAnalytics } from "./loadGoogleAnalytics";

describe("loadGoogleAnalytics", () => {
  const clearGoogleAnalytics = () => {
    delete window.dataLayer;
    delete window.gtag;
    document.head
      .querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')
      .forEach((script) => {
        script.remove();
      });
  };

  const dataLayerEntriesAsArrays = (): unknown[][] =>
    window.dataLayer!.map((entry): unknown[] =>
      Array.from(entry as ArrayLike<unknown>),
    );

  const measurementId = "test-measurement-id";

  const captureConfigEntry = (referrer: string): unknown => {
    const referrerSpy = jest
      .spyOn(document, "referrer", "get")
      .mockReturnValue(referrer);

    try {
      loadGoogleAnalytics(true, measurementId);
      const [, , , configEntry] = dataLayerEntriesAsArrays();
      return configEntry;
    } finally {
      referrerSpy.mockRestore();
      window.history.replaceState(null, "", "/");
    }
  };

  const googleAnalyticsScriptSelector =
    'script[src*="googletagmanager.com/gtag/js"]';
  const queryFreePageSettings = {
    // eslint-disable-next-line camelcase
    allow_google_signals: false,
    // eslint-disable-next-line camelcase
    cookie_expires: 33_696_000,
    // eslint-disable-next-line camelcase
    cookie_update: false,
    // eslint-disable-next-line camelcase
    page_location: "http://localhost/",
    // eslint-disable-next-line camelcase
    page_referrer: "",
  };
  const deniedConsentSettings = {
    // eslint-disable-next-line camelcase
    ad_personalization: "denied",
    // eslint-disable-next-line camelcase
    ad_storage: "denied",
    // eslint-disable-next-line camelcase
    ad_user_data: "denied",
    // eslint-disable-next-line camelcase
    analytics_storage: "denied",
  };
  const grantedAnalyticsConsentSettings = {
    ...deniedConsentSettings,
    // eslint-disable-next-line camelcase
    analytics_storage: "granted",
  };

  it.each([
    { consented: null, measurementId: null },
    { consented: false, measurementId: null },
    { consented: true, measurementId: null },
    { consented: null, measurementId },
    { consented: false, measurementId },
  ])(
    "does not initialize Google Analytics with consent $consented and measurement ID $measurementId",
    ({ consented, measurementId: currentMeasurementId }) => {
      clearGoogleAnalytics();

      loadGoogleAnalytics(consented, currentMeasurementId);

      expect(window.dataLayer).toBeUndefined();
      expect(
        document.head.querySelector(googleAnalyticsScriptSelector),
      ).toBeNull();
    },
  );

  it("initializes basic consent mode only after consent is granted", () => {
    clearGoogleAnalytics();

    loadGoogleAnalytics(true, measurementId);

    expect(dataLayerEntriesAsArrays()).toStrictEqual([
      ["consent", "default", deniedConsentSettings],
      ["consent", "update", grantedAnalyticsConsentSettings],
      ["js", expect.any(Date)],
      ["config", measurementId, queryFreePageSettings],
    ]);
    expect(
      document.head.querySelector<HTMLScriptElement>(
        googleAnalyticsScriptSelector,
      )!.src,
    ).toBe(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  });

  it("does not initialize Google Analytics more than once", () => {
    clearGoogleAnalytics();

    loadGoogleAnalytics(true, measurementId);
    loadGoogleAnalytics(true, measurementId);
    loadGoogleAnalytics(false, measurementId);

    expect(dataLayerEntriesAsArrays()).toHaveLength(4);
    expect(
      document.head.querySelectorAll(googleAnalyticsScriptSelector),
    ).toHaveLength(1);
  });

  it("removes card state from consented page and referrer URLs", () => {
    clearGoogleAnalytics();
    window.history.replaceState(
      null,
      "",
      "/cribbage-trainer/pr/679/?hand=AS,2H,3D,4C,5D,6H&discard=AS,2H#result",
    );
    const configEntry = captureConfigEntry(
      "https://example.com/cribbage-trainer/?hand=KC,QD&seed=private#cards",
    );

    expect(configEntry).toStrictEqual([
      "config",
      measurementId,
      {
        // eslint-disable-next-line camelcase
        allow_google_signals: false,
        // eslint-disable-next-line camelcase
        cookie_expires: 33_696_000,
        // eslint-disable-next-line camelcase
        cookie_update: false,
        // eslint-disable-next-line camelcase
        page_location: "http://localhost/cribbage-trainer/pr/679/",
        // eslint-disable-next-line camelcase
        page_referrer: "https://example.com/",
      },
    ]);
  });
});
