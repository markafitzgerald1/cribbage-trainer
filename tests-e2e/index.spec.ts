import { expect, test } from "@playwright/test";

test("double tap zoom disabled to speed up mobile onclick handling", async ({
  page,
}) => {
  await page.goto("/");
  expect(
    await page.$('meta[name="viewport"][content="width=device-width"]')
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
    await page.$('link[rel="stylesheet"][href*="index."][href$=".css"]')
  ).not.toBeNull();
});

test("pre-cut hand points show after select of two discards", async ({
  page,
}) => {
  await page.goto("/");

  const discardCount = 2;
  for (let index = 0; index < discardCount; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await page.click(`.hand li:nth-child(${index + 1})`);
  }

  expect(
    await Promise.all(
      (
        await page.$$("figcaption")
      ).map(
        async (figcaption) =>
          (await figcaption.textContent()) === "Pre-cut hand points:"
      )
    ).then((results) => results.some(Boolean))
  ).toBe(true);
});
