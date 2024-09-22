import { describe, expect, it } from "@jest/globals";
import { loadGoogleAnalytics } from "./loadGoogleAnalytics";

describe("handleLoadGoogleAnalytics", () => {
  const clearDataLayerGTagAndScript = () => {
    delete window.dataLayer;
    delete window.gtag;
    document.head.querySelectorAll("script").forEach((script) => {
      script.remove();
    });
  };

  it("sets window.dataLayer and gtag if window.dataLayer is not set", () => {
    clearDataLayerGTagAndScript();

    loadGoogleAnalytics(null, null);

    expect(window.dataLayer).toStrictEqual([]);
    expect(window.gtag).toBeInstanceOf(Function);
  });

  it("does not set window.dataLayer and gtag if window.dataLayer is set", () => {
    clearDataLayerGTagAndScript();
    const originalWindowDataLayer = [Math.random()];
    window.dataLayer = originalWindowDataLayer;

    loadGoogleAnalytics(null, null);

    expect(window.dataLayer).toStrictEqual(originalWindowDataLayer);
    expect(window.gtag).toBeUndefined();
  });

  it("loads the Google Analytics script and populates its data layer if window.dataLayer not set and measurementId is set", () => {
    clearDataLayerGTagAndScript();

    loadGoogleAnalytics(null, "test-measurement-id");

    expect(document.head.querySelector("script")!.src).toBe(
      "https://www.googletagmanager.com/gtag/js?id=test-measurement-id",
    );
    expect(window.dataLayer![0]).toStrictEqual(["js", expect.any(Date)]);
    expect(window.dataLayer![1]).toStrictEqual([
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
    const consentDataLayerIndex = 2;
    const configDataLayerIndex = 3;

    loadGoogleAnalytics(true, "test-measurement-id");

    expect(window.dataLayer![consentDataLayerIndex]).toStrictEqual([
      "consent",
      "update",
      {
        // eslint-disable-next-line camelcase
        analytics_storage: "granted",
      },
    ]);
    expect(window.dataLayer![configDataLayerIndex]).toStrictEqual([
      "config",
      "test-measurement-id",
    ]);
  });
});
