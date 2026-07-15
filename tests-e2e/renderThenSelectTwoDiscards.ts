import type { Page } from "@playwright/test";
import { SortOrder } from "../src/ui/SortOrder";

export const waitForAnalysis = async (page: Page) => {
  await page.locator('text="Loading analysis..."').waitFor({ state: "hidden" });
  await page.getByRole("table").waitFor({ state: "visible" });
};

export const renderThenSelectTwoDiscards = async (
  page: Page,
  constantSeedQuery: string,
  acceptAnalytics = false,
) => {
  if (acceptAnalytics) {
    // Pre-seed stored consent so the banner mounts already collapsed.
    // Clicking Accept instead starts the dialog's multi-second fade timer.
    // That slows every screenshot test and races the capture against it.
    await page.addInitScript(() => {
      window.localStorage.setItem("analyticsConsent", "true");
    });
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
