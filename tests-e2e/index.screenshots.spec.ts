import { expect, test } from "@playwright/test";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";

const constantHandQuery = "?hand=KH,QS,10D,9C,6S,5H&seed=e2e";

const testInitialRenderScreenshot = () =>
  test("initial page render with fixed random seed still visually the same", async ({
    page,
  }) => {
    await page.goto(`/${constantHandQuery}`);

    await expect(page).toHaveScreenshot();
  });

const testPrivacyPolicyScreenshot = () =>
  test("privacy policy modal with analysis visible still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);

    await page
      .locator('span[role="button"]:has-text("Privacy Policy")')
      .click();

    await expect(page).toHaveScreenshot();
  });

const testScoredPossibilitiesNoExpansionScreenshot = () =>
  test("scored possibilities with no expansion still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);

    await expect(page).toHaveScreenshot();
  });

const testExpandedRowScreenshot = () =>
  test("scored possibilities with one row expanded still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);

    await page.locator("tbody tr").first().click();

    await expect(page).toHaveScreenshot();
  });

const testDoubleExpandedScreenshot = () =>
  test("starter details show after double expansion still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);

    await page.locator("tbody tr").first().click();
    await page.getByRole("button", { name: "Hand starter avg" }).click();

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
  testPrivacyPolicyScreenshot();
  testScoredPossibilitiesNoExpansionScreenshot();
  testExpandedRowScreenshot();
  testDoubleExpandedScreenshot();
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
