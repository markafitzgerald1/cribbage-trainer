import { expect, test } from "@playwright/test";

const expectedHtmlLanguage = "en";

test(`HTML language '${expectedHtmlLanguage}' is specified`, async ({
  page,
}) => {
  await page.goto("/");
  expect(await page.$(`html[lang="${expectedHtmlLanguage}"]`)).not.toBeNull();
});

test("initial page render with fixed random seed still visually the same", async ({
  page,
}) => {
  await page.goto("/?seed=1");
  await expect(page).toHaveScreenshot();
});
