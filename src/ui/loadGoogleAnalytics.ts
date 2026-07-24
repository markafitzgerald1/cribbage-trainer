import { gtag } from "./gtag";

type AnalyticsStorageConsent = "denied" | "granted";

const THIRTEEN_MONTHS_IN_SECONDS = 33_696_000;

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

const sanitizePageUrl = (url: string): string => {
  const parsedUrl = new URL(url);
  return `${parsedUrl.origin}${parsedUrl.pathname}`;
};

const sanitizeReferrerUrl = (url: string): string => {
  if (url === "") {
    return "";
  }

  return `${new URL(url).origin}/`;
};

const getPageSettings = () => ({
  // eslint-disable-next-line camelcase
  allow_google_signals: false,
  // eslint-disable-next-line camelcase
  cookie_expires: THIRTEEN_MONTHS_IN_SECONDS,
  // eslint-disable-next-line camelcase
  cookie_update: false,
  // Never send URL state containing cards, discards, roles, or seeds.
  // eslint-disable-next-line camelcase
  page_location: sanitizePageUrl(window.location.href),
  // eslint-disable-next-line camelcase
  page_referrer: sanitizeReferrerUrl(document.referrer),
});

export function loadGoogleAnalytics(
  consented: boolean | null,
  measurementId: string | null,
) {
  if (consented !== true || !measurementId || window.dataLayer) {
    return;
  }

  window.dataLayer = [];
  gtag("consent", "default", getConsentSettings("denied"));
  gtag("consent", "update", getConsentSettings("granted"));
  gtag("js", new Date());
  gtag("config", measurementId, getPageSettings());

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);
}
