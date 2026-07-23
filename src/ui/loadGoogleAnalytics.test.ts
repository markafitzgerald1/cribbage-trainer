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
      loadGoogleAnalytics(false, measurementId);
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

  it("does not initialize Google Analytics without a measurement ID", () => {
    clearGoogleAnalytics();

    loadGoogleAnalytics(null, null);

    expect(window.dataLayer).toBeUndefined();
    expect(
      document.head.querySelector(googleAnalyticsScriptSelector),
    ).toBeNull();
  });

  it.each([
    {
      consentUpdates: [],
      consented: null,
      scenario: "consent is unanswered",
    },
    {
      consentUpdates: [["consent", "update", deniedConsentSettings]],
      consented: false,
      scenario: "consent is declined",
    },
    {
      consentUpdates: [["consent", "update", grantedAnalyticsConsentSettings]],
      consented: true,
      scenario: "consent is granted",
    },
  ] as const)(
    "initializes advanced consent mode when $scenario",
    ({ consented, consentUpdates }) => {
      clearGoogleAnalytics();

      loadGoogleAnalytics(consented, measurementId);

      expect(dataLayerEntriesAsArrays()).toStrictEqual([
        ["consent", "default", deniedConsentSettings],
        ...consentUpdates,
        ["js", expect.any(Date)],
        ["config", measurementId, queryFreePageSettings],
      ]);

      expect(
        document.head.querySelector<HTMLScriptElement>(
          googleAnalyticsScriptSelector,
        )!.src,
      ).toBe(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
    },
  );

  it("updates changed consent without initializing Google Analytics again", () => {
    clearGoogleAnalytics();

    loadGoogleAnalytics(null, measurementId);
    loadGoogleAnalytics(false, measurementId);
    loadGoogleAnalytics(false, measurementId);
    loadGoogleAnalytics(true, measurementId);
    loadGoogleAnalytics(true, measurementId);

    const entries = dataLayerEntriesAsArrays();

    expect(entries[0]).toStrictEqual([
      "consent",
      "default",
      deniedConsentSettings,
    ]);
    expect(entries[1]).toStrictEqual(["js", expect.any(Date)]);
    expect(entries[2]).toStrictEqual([
      "config",
      measurementId,
      queryFreePageSettings,
    ]);
    expect(entries.slice(3)).toStrictEqual([
      ["consent", "update", deniedConsentSettings],
      ["consent", "update", grantedAnalyticsConsentSettings],
    ]);
    expect(
      document.head.querySelectorAll(googleAnalyticsScriptSelector),
    ).toHaveLength(1);
  });

  it("removes card state from denied-consent page and referrer URLs", () => {
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
        page_location: "http://localhost/cribbage-trainer/pr/679/",
        // eslint-disable-next-line camelcase
        page_referrer: "https://example.com/",
      },
    ]);
  });
});
