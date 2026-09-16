import { type Page } from "@playwright/test";

/*
 * The seeded query matters: `?seed=manual-entry` makes the startup hand
 * practice, which several Enter-cards specs rely on, and it deals a full six
 * so the picker's unselected tiles are disabled.
 */
export const openCardEntryDialog = async (page: Page) => {
  await page.goto("/?seed=manual-entry");
  await page.getByRole("button", { name: "Enter cards" }).click();
};
