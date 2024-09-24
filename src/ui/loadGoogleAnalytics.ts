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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    (window.dataLayer as unknown[]).push(arguments);
  }

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
