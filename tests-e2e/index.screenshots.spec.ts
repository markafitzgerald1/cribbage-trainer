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

test("Privacy Policy link has a high-contrast color on the consent surface", async ({
  page,
}) => {
  await page.goto(`/${constantHandQuery}`);

  await expect(
    page.getByRole("button", { exact: true, name: "Privacy Policy" }),
  ).toHaveCSS("color", "rgb(0, 0, 0)");
});

const testEnterCardsDialogScreenshot = () =>
  test("enter cards dialog still visually the same", async ({ page }) => {
    await page.goto(`/${constantHandQuery}`);
    await page.getByRole("button", { name: "Enter cards" }).click();

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
    await page.getByRole("button", { name: "+Cut avg" }).click();

    await expect(page).toHaveScreenshot();
  });

const testCribExpandedScreenshot = () =>
  test("crib starter details show after crib avg expansion still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);

    await page.locator("tbody tr").first().click();
    await page.getByRole("button", { name: "Crib avg" }).click();

    await expect(page).toHaveScreenshot();
  });

testInitialRenderScreenshot();

const typicalPhoneViewportSize = {
  iPhone12: {
    cross: 390,
    main: 844,
  },
};

const nearSquareLandscapeViewportSize = {
  height: 900,
  width: 1000,
};

const testScreenshots = () => {
  testInitialRenderScreenshot();
  testEnterCardsDialogScreenshot();
  testPrivacyPolicyScreenshot();
  testScoredPossibilitiesNoExpansionScreenshot();
  testExpandedRowScreenshot();
  testDoubleExpandedScreenshot();
  testCribExpandedScreenshot();
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

test.describe("near-square landscape", () => {
  test.use({ viewport: nearSquareLandscapeViewportSize });

  testScoredPossibilitiesNoExpansionScreenshot();
});
