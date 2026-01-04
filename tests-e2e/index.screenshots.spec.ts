import { expect, test } from "@playwright/test";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";

const constantSeedQuery = "?seed=4";

const testInitialRenderScreenshot = () =>
  test("initial page render with fixed random seed still visually the same", async ({
    page,
  }) => {
    await page.goto(`/${constantSeedQuery}`);

    await expect(page).toHaveScreenshot();
  });

const testPrivacyPolicyScreenshot = () =>
  test("privacy policy modal still visually the same", async ({ page }) => {
    await page.goto(`/${constantSeedQuery}`);

    await page
      .locator('span[role="button"]:has-text("Privacy Policy")')
      .click();

    await expect(page).toHaveScreenshot();
  });

const testPrivacyPolicyAcceptThenSelectScreenshot = () =>
  test("pre-cut hand points show after select of two discards still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, constantSeedQuery, true);

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
  testPrivacyPolicyAcceptThenSelectScreenshot();
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
