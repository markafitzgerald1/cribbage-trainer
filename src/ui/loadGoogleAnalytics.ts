import { gtag } from "./gtag";

type AnalyticsStorageConsent = "denied" | "granted";

const reportedConsent = new WeakMap<unknown[], boolean>();

const getConsentSettings = (analyticsStorage: AnalyticsStorageConsent) => ({
  // eslint-disable-next-line camelcase
  ad_personalization: "denied",
  // eslint-disable-next-line camelcase
  ad_storage: "denied",
  // eslint-disable-next-line camelcase
  ad_user_data: "denied",
  // eslint-disable-next-line camelcase
  analytics_storage: analyticsStorage,
});

const updateGoogleAnalyticsConsent = (consented: boolean | null) => {
  if (
    consented === null ||
    !window.dataLayer ||
    reportedConsent.get(window.dataLayer) === consented
  ) {
    return;
  }

  gtag(
    "consent",
    "update",
    getConsentSettings(consented ? "granted" : "denied"),
  );
  reportedConsent.set(window.dataLayer, consented);
};

export function loadGoogleAnalytics(
  consented: boolean | null,
  measurementId: string | null,
) {
  if (!measurementId) {
    return;
  }

  if (!window.dataLayer) {
    window.dataLayer = [];
    gtag("consent", "default", getConsentSettings("denied"));
    updateGoogleAnalyticsConsent(consented);
    gtag("js", new Date());
    gtag("config", measurementId);

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);
    return;
  }

  updateGoogleAnalyticsConsent(consented);
}
