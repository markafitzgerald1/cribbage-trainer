import { expect, test } from "@playwright/test";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";

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
