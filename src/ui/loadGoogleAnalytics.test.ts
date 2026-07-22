import { describe, expect, it } from "@jest/globals";
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

  function dataLayerEntryToArray(entry: unknown): unknown[] {
    return Array.from(entry as IArguments);
  }

  const measurementId = "test-measurement-id";
  const googleAnalyticsScriptSelector =
    'script[src*="googletagmanager.com/gtag/js"]';

  it.each([
    ["consent is unanswered", null, measurementId],
    ["consent is declined", false, measurementId],
    ["the measurement ID is missing", true, null],
  ] as const)(
    "does not initialize Google Analytics when %s",
    (_scenario, consented, selectedMeasurementId) => {
      clearGoogleAnalytics();

      loadGoogleAnalytics(consented, selectedMeasurementId);

      expect(window.dataLayer).toBeUndefined();
      expect(
        document.head.querySelector(googleAnalyticsScriptSelector),
      ).toBeNull();
    },
  );

  it("initializes Google Analytics after consent is granted", () => {
    clearGoogleAnalytics();

    loadGoogleAnalytics(true, measurementId);

    expect(
      document.head.querySelector<HTMLScriptElement>(
        googleAnalyticsScriptSelector,
      )!.src,
    ).toBe(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
    expect(dataLayerEntryToArray(window.dataLayer![0])).toStrictEqual([
      "consent",
      "default",
      {
        // eslint-disable-next-line camelcase
        analytics_storage: "denied",
      },
    ]);
    expect(dataLayerEntryToArray(window.dataLayer![1])).toStrictEqual([
      "consent",
      "update",
      {
        // eslint-disable-next-line camelcase
        analytics_storage: "granted",
      },
    ]);
    expect(dataLayerEntryToArray(window.dataLayer![2])).toStrictEqual([
      "js",
      expect.any(Date),
    ]);
    expect(dataLayerEntryToArray(window.dataLayer![3])).toStrictEqual([
      "config",
      measurementId,
    ]);
  });

  it("initializes Google Analytics only once", () => {
    clearGoogleAnalytics();

    loadGoogleAnalytics(true, measurementId);
    loadGoogleAnalytics(true, measurementId);

    expect(
      document.head.querySelectorAll(googleAnalyticsScriptSelector),
    ).toHaveLength(1);
    expect(window.dataLayer).toHaveLength(4);
  });
});
