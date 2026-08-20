import {
  DECISION_QUALITY_MEASUREMENT,
  PRIVACY_POLICY_VERSION,
  acceptedMeasurementsKey,
  analyticsConsentKey,
  answeredPolicyVersionKey,
} from "../src/ui/analyticsConsent";
import type { Page } from "@playwright/test";
import { SortOrder } from "../src/ui/SortOrder";
import { blockGoogleAnalytics } from "./blockGoogleAnalytics";

export const waitForAnalysis = async (page: Page) => {
  await page.locator('text="Loading analysis..."').waitFor({ state: "hidden" });
  await page.getByRole("table").waitFor({ state: "visible" });
};

export const renderThenSelectTwoDiscards = async (
  page: Page,
  constantSeedQuery: string,
  acceptAnalytics = false,
) => {
  // Stored consent loads the real tag against the e2e test measurement ID, so keep those requests inside CI.
  await blockGoogleAnalytics(page);

  if (acceptAnalytics) {
    // Pre-seed stored consent so the banner mounts already collapsed.
    // Clicking Accept instead starts the dialog's multi-second fade timer.
    // That slows every screenshot test and races the capture against it.
    // The answered policy version is part of that stored state.
    // Consent predating the current policy re-opens the banner to ask.
    await page.addInitScript(
      (storedChoice: Record<string, string>) => {
        Object.entries(storedChoice).forEach(([key, value]) => {
          window.localStorage.setItem(key, value);
        });
      },
      {
        [acceptedMeasurementsKey]: DECISION_QUALITY_MEASUREMENT,
        [analyticsConsentKey]: "true",
        [answeredPolicyVersionKey]: PRIVACY_POLICY_VERSION,
      },
    );
  }

  await page.goto(`/${constantSeedQuery}`);

  const discardCount = 2;
  const checkboxes = page.getByRole("checkbox");
  for (let index = 0; index < discardCount; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await checkboxes.nth(index).click();
  }

  const dealOrderKey = Object.entries(SortOrder).find(
    ([, value]) => value === SortOrder.DealOrder,
  )?.[0];
  await page.locator(`label[for="${dealOrderKey}"]`).first().click();

  await waitForAnalysis(page);
};
