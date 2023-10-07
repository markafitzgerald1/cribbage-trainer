import { Page, expect, test } from "@playwright/test";

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

const renderThenSelectTwoDiscards = async (
  page: Page,
  constantSeedQuery: string,
) => {
  await page.goto(`/${constantSeedQuery}`);

  const discardCount = 2;
  const checkboxes = page.getByRole("checkbox");
  for (let index = 0; index < discardCount; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await checkboxes.nth(index).click();
  }
};

test("pre-cut hand points show after select of two discards", async ({
  page,
}) => {
  await renderThenSelectTwoDiscards(page, "");

  await expect(page.getByText("Pre-cut hand")).toBeVisible();
});

const constantSeedQuery = "?seed=1";

const testInitialRenderScreenshot = () =>
  test("initial page render with fixed random seed still visually the same", async ({
    page,
  }) => {
    await page.goto(`/${constantSeedQuery}`);

    await expect(page).toHaveScreenshot();
  });

const testPostSelectScreenshot = () =>
  test("pre-cut hand points show after select of two discards still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, constantSeedQuery);

    await expect(page).toHaveScreenshot();
  });

testInitialRenderScreenshot();

const typicalPhoneViewportSize = {
  iPhone12: {
    cross: 390,
    main: 844,
  },
};

const testScreenshots = () => {
  testInitialRenderScreenshot();
  testPostSelectScreenshot();
};

test.describe("portrait", () => {
  test.use({
    viewport: {
      height: typicalPhoneViewportSize.iPhone12.main,
      width: typicalPhoneViewportSize.iPhone12.cross,
    },
  });

  testScreenshots();
});

test.describe("landscape", () => {
  test.use({
    viewport: {
      height: typicalPhoneViewportSize.iPhone12.cross,
      width: typicalPhoneViewportSize.iPhone12.main,
    },
  });

  testScreenshots();
});
