import { gtag } from "./gtag";

export function loadGoogleAnalytics(
  consented: boolean | null,
  measurementId: string | null,
) {
  if (consented !== true || !measurementId || window.dataLayer) {
    return;
  }

  window.dataLayer = [];
  gtag("consent", "default", {
    // eslint-disable-next-line camelcase
    analytics_storage: "denied",
  });
  gtag("consent", "update", {
    // eslint-disable-next-line camelcase
    analytics_storage: "granted",
  });
  gtag("js", new Date());
  gtag("config", measurementId);

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);
}
