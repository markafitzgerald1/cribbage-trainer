import { gtag } from "./gtag";

export function loadGoogleAnalytics(
  consented: boolean | null,
  measurementId: string | null,
) {
  if (!window.dataLayer) {
    window.dataLayer = [];

    if (measurementId) {
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.async = true;
      document.head.appendChild(script);

      gtag("js", new Date());
      gtag("config", measurementId);
      gtag("consent", "default", {
        // eslint-disable-next-line camelcase
        analytics_storage: "denied",
      });
    }
  }

  if (consented) {
    gtag("consent", "update", {
      // eslint-disable-next-line camelcase
      analytics_storage: "granted",
    });
    gtag("config", measurementId);
  }
}
