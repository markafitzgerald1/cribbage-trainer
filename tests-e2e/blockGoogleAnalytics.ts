import type { Page } from "@playwright/test";

export const GOOGLE_ANALYTICS_URL_PATTERN =
  /googletagmanager\.com|google-analytics\.com/u;

export const GOOGLE_TAG_SELECTOR =
  'script[src*="googletagmanager.com/gtag/js"]';

// The e2e build carries a test measurement ID (playwright.config.ts) so that the consent-gated load path runs for real instead of short-circuiting on a missing ID.
// Blocking the hosts keeps that path from sending anything to Google from CI.
// The returned array records every request the page attempted.
export const blockGoogleAnalytics = async (page: Page) => {
  const googleRequests: string[] = [];

  await page.route(GOOGLE_ANALYTICS_URL_PATTERN, async (route) => {
    googleRequests.push(route.request().url());
    await route.abort();
  });

  return googleRequests;
};
