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

test("double tap zoom disabled to speed up mobile onclick handling", async ({
  page,
}) => {
  await page.goto("/");
  expect(
    await page.$('meta[name="viewport"][content="width=device-width"]'),
  ).not.toBeNull();
});

const expectedTitle = "Cribbage Trainer";

test(`has title '${expectedTitle}'`, async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(expectedTitle);
});

test("styles.css is linked", async ({ page }) => {
  await page.goto("/");
  expect(
    await page.$('link[rel="stylesheet"][href*="styles."][href$=".css"]'),
  ).not.toBeNull();
});

const constantSeedQuery = "?seed=1";

test("pre-cut hand points show after select of two discards", async ({
  page,
}) => {
  await renderThenSelectTwoDiscards(page, constantSeedQuery);

  await expect(page.getByText("Pre-cut hand")).toBeVisible();
});
