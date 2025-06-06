import type { Page } from "@playwright/test";
import { SortOrder } from "../src/ui/SortOrder";

export const renderThenSelectTwoDiscards = async (
  page: Page,
  constantSeedQuery: string,
  acceptAnalytics = false,
) => {
  await page.goto(`/${constantSeedQuery}`);

  if (acceptAnalytics) {
    await page.locator('button:has-text("Accept")').click();
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
};
