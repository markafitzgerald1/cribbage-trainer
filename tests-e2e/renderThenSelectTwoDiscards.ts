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
  await page.goto(`/${constantSeedQuery}`);

  if (acceptAnalytics) {
    await page.locator('button:has-text("Accept")').click();
    // The consent dialog swaps to its minimal state on a JS timer.
    // Playwright disables CSS animations, not JS timers, for screenshots.
    // Waiting out the swap keeps captures from racing the fading message.
    await page.getByText(/^Thank you!/u).waitFor({ state: "hidden" });
  }

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
