import { expect, test } from "@playwright/test";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";

const expectedHtmlLanguage = "en";

test(`HTML language '${expectedHtmlLanguage}' is specified`, async ({
  page,
}) => {
  await page.goto("/");
  expect(await page.$(`html[lang="${expectedHtmlLanguage}"]`)).not.toBeNull();
});

const expectedCharset = "utf-8";

test(`HTML charset '${expectedCharset}' is specified`, async ({ page }) => {
  await page.goto("/");
  expect(await page.$(`meta[charset="${expectedCharset}"]`)).not.toBeNull();
});

test("standard mobile viewport is specified", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    "width=device-width, initial-scale=1",
  );
});

const expectedTitle = "Cribbage Trainer";

test(`has title '${expectedTitle}'`, async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(expectedTitle);
});

test("a .css file is linked", async ({ page }) => {
  await page.goto("/");
  expect(await page.$('link[rel="stylesheet"][href$=".css"]')).not.toBeNull();
});

const constantHandQuery = "?hand=KH,QS,10D,9C,6S,5H";

test("pre-cut hand points show after select of two discards", async ({
  page,
}) => {
  await renderThenSelectTwoDiscards(page, constantHandQuery);

  await expect(
    page.getByRole("columnheader", { exact: true, name: "Hand" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { exact: true, name: "Cut" }),
  ).toBeVisible();
});

test("semantic e2e suited analysis flow", async ({ page }) => {
  await page.goto("/?hand=KH,QS,10D,9C,6S,5H");

  // Click the 6S and 5H cards to select them for discard
  const indexOf6S = 4;
  const indexOf5H = 5;
  await page.getByRole("checkbox").nth(indexOf6S).click();
  await page.getByRole("checkbox").nth(indexOf5H).click();

  // Assert that the expected row correctly renders the suited keep labels (K♥ Q♠ 10♦ 9♣) and discard labels (6♠ 5♥)
  const row = page.locator("tbody tr").filter({ hasText: "K♥Q♠10♦9♣(6♠5♥)" });
  await expect(row).toBeVisible();

  // Expand that first result row
  await row.click();

  // Assert that the breakdown headers are visible in the DOM
  await expect(page.locator("tbody").getByText("15s", { exact: true })).toBeVisible();
  await expect(page.locator("tbody").getByText("Pairs", { exact: true })).toBeVisible();
  await expect(page.locator("tbody").getByText("Runs", { exact: true })).toBeVisible();
  await expect(page.locator("tbody").getByText("Flush", { exact: false })).toBeVisible();
  await expect(page.locator("tbody").getByText("Nobs", { exact: true })).toBeVisible();
  await expect(page.locator("tbody").getByText("Total", { exact: true })).toBeVisible();
  await expect(page.getByText("Starter avg")).toBeVisible();

  // Click the 'Starter avg' header
  await page.getByText("Starter avg").click();

  // Assert that the starter-specific cut details expand and are visible
  await expect(page.locator('div[class*="cut-result-row"]').first()).toBeVisible();
});
