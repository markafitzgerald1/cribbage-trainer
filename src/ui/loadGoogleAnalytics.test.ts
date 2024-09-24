import { describe, expect, it } from "@jest/globals";
import { loadGoogleAnalytics } from "./loadGoogleAnalytics";

describe("loadGoogleAnalytics", () => {
  const clearDataLayerGTagAndScript = () => {
    delete window.dataLayer;
    delete window.gtag;
    document.head.querySelectorAll("script").forEach((script) => {
      script.remove();
    });
  };

  function dataLayerEntryToArray(entry: unknown): unknown[] {
    return Array.from(entry as IArguments);
  }

  it("sets window.dataLayer if window.dataLayer is not set", () => {
    clearDataLayerGTagAndScript();

    loadGoogleAnalytics(null, null);

    expect(window.dataLayer).toStrictEqual([]);
  });

  it("does not set window.dataLayer and gtag if window.dataLayer is set", () => {
    clearDataLayerGTagAndScript();
    const originalWindowDataLayer = [Math.random()];
    window.dataLayer = originalWindowDataLayer;

    loadGoogleAnalytics(null, null);

    expect(window.dataLayer).toStrictEqual(originalWindowDataLayer);
    expect(window.gtag).toBeUndefined();
  });

  const measurementId = "test-measurement-id";

  it("loads the Google Analytics script and populates its data layer if window.dataLayer not set and measurementId is set", () => {
    clearDataLayerGTagAndScript();
    const consentDefaultDataLayerIndex = 2;

    loadGoogleAnalytics(null, measurementId);

    expect(document.head.querySelector("script")!.src).toBe(
      `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
    );

    expect(dataLayerEntryToArray(window.dataLayer![0])).toStrictEqual([
      "js",
      expect.any(Date),
    ]);
    expect(dataLayerEntryToArray(window.dataLayer![1])).toStrictEqual([
      "config",
      measurementId,
    ]);
    expect(
      dataLayerEntryToArray(window.dataLayer![consentDefaultDataLayerIndex]),
    ).toStrictEqual([
      "consent",
      "default",
      {
        // eslint-disable-next-line camelcase
        analytics_storage: "denied",
      },
    ]);
  });

  it("stores consent grant and measurement ID in the data layer if consented", () => {
    clearDataLayerGTagAndScript();
    const consentUpdateDataLayerIndex = 3;
    const configDataLayerIndex = 4;

    loadGoogleAnalytics(true, measurementId);

    expect(
      dataLayerEntryToArray(window.dataLayer![consentUpdateDataLayerIndex]),
    ).toStrictEqual([
      "consent",
      "update",
      {
        // eslint-disable-next-line camelcase
        analytics_storage: "granted",
      },
    ]);
    expect(
      dataLayerEntryToArray(window.dataLayer![configDataLayerIndex]),
    ).toStrictEqual(["config", measurementId]);
  });
});
