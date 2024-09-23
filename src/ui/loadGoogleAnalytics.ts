declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function loadGoogleAnalytics(
  consented: boolean | null,
  measurementId: string | null,
) {
  const gtag = (...args: unknown[]) =>
    (window.dataLayer as unknown[]).push(args);

  if (!window.dataLayer) {
    window.dataLayer = [];
    window.gtag = gtag;

    if (measurementId) {
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.async = true;
      document.head.appendChild(script);

      gtag("js", new Date());
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
