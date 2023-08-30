import { expect, test } from "@playwright/test";

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
    await page.$('link[rel="stylesheet"][href*="index."][href$=".css"]'),
  ).not.toBeNull();
});

test("initial page render with fixed random seed still visually the same", async ({
  page,
}) => {
  await page.goto("/?seed=1");
  await expect(page).toHaveScreenshot();
});

test("pre-cut hand points show after select of two discards", async ({
  page,
}) => {
  await page.goto("/");

  const discardCount = 2;
  const checkboxes = page.getByRole("checkbox");
  for (let index = 0; index < discardCount; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await checkboxes.nth(index).click();
  }

  await expect(page.getByText("Pre-cut hand points:")).toBeVisible();
});
