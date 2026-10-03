import { type Page, expect, test } from "@playwright/test";
import { blockGoogleAnalytics } from "./blockGoogleAnalytics";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

const selectTwoDiscards = async (page: Page) => {
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
};

test("counts a reload of the app's own undecided hand as a resumed hand", async ({
  page,
}) => {
  await blockGoogleAnalytics(page);
  await page.goto("/");
  const firstCard = page.getByRole("checkbox").first();
  await firstCard.click();
  await firstCard.click();
  await expect(page).toHaveURL(/[?&]hand=/u);

  await page.reload();

  await selectTwoDiscards(page);
  await waitForAnalysis(page);

  await expect(page.getByText("Lost per discard")).toBeVisible();
});

test("counts a skip when a reloaded own hand is left", async ({ page }) => {
  await blockGoogleAnalytics(page);
  await page.goto("/");
  const firstCard = page.getByRole("checkbox").first();
  await firstCard.click();
  await firstCard.click();
  await expect(page).toHaveURL(/[?&]hand=/u);

  await page.reload();
  await page.getByRole("button", { exact: true, name: "Deal" }).click();

  await expect(page.getByText("Hands skipped")).toBeVisible();
});

test("leaves a foreign deep link out of the tally", async ({ page }) => {
  await blockGoogleAnalytics(page);
  await page.goto("/?hand=AS,2S,3S,4S,5S,6S&role=dealer");

  await selectTwoDiscards(page);
  await waitForAnalysis(page);

  await expect(page.getByText("Lost per discard")).toBeHidden();
});
