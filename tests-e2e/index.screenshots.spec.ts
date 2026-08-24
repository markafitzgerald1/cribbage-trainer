import { expect, test } from "@playwright/test";
import { constantHandQuery } from "./layoutMeasurements";
import { discardTallyKey } from "../src/ui/discardTally";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";

/*
 * A history deep enough to render every part of the tally, including today's
 * own figures, written straight into storage. The lifetime numbers come from
 * the counters and today's from the records, so the shot exercises both
 * periods rather than only the half that survives an empty record list.
 *
 * Each record is dated when the script runs, because "today" is whatever
 * day the suite runs on; the losses are fixed, so every figure on screen is
 * still deterministic.
 */
const STORED_TALLY_LIFETIME = {
  decisions: 9,
  expectedPointsLossTotal: 11.07,
  optimalDecisions: 4,
};

const BEST_TODAY = 0.4;
const NEAR_MISS = 0.5;
const WORST_TODAY = 0.9;
const TODAY_LOSSES = [NEAR_MISS, WORST_TODAY, BEST_TODAY];

const testInitialRenderScreenshot = () =>
  test("initial page render with fixed random seed still visually the same", async ({
    page,
  }) => {
    await page.goto(`/${constantHandQuery}`);

    await expect(page).toHaveScreenshot();
  });

const testEnterCardsDialogScreenshot = () =>
  test("enter cards dialog still visually the same", async ({ page }) => {
    await page.goto(`/${constantHandQuery}`);
    await page.getByRole("button", { name: "Enter cards" }).click();

    // Capture the opaque modal panel, not the whole page.
    // The translucent overlay dims the hand showing through the panel margins.
    // That shown-through background is noisier across arm64/amd64 than the dialog.
    const modalPanel = page
      .getByRole("button", { name: "Close modal" })
      .locator("..");
    await expect(modalPanel).toHaveScreenshot();
  });

const testPrivacyPolicyScreenshot = () =>
  test("privacy policy modal with analysis visible still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);

    await page.getByRole("button", { name: "Privacy Policy" }).click();

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

const testDiscardTallyScreenshot = () =>
  test("discard tally still visually the same", async ({ page }) => {
    await page.addInitScript(
      (stored: {
        readonly best: number;
        readonly key: string;
        readonly lifetime: unknown;
        readonly losses: readonly number[];
      }) => {
        window.localStorage.setItem(
          stored.key,
          JSON.stringify({
            lifetime: stored.lifetime,
            records: stored.losses.map((loss, index) => ({
              at: Date.now(),
              cribRole: "Dealer",
              expectedPointsLoss: loss,
              handKey: `stored-${index}`,
              isOptimal: loss === stored.best,
              isPractice: false,
            })),
            version: 1,
          }),
        );
      },
      {
        best: BEST_TODAY,
        key: discardTallyKey,
        lifetime: STORED_TALLY_LIFETIME,
        losses: TODAY_LOSSES,
      },
    );
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);

    /*
     * The tally itself rather than the page. It sits below a clipped analysis
     * table, and how many rows that table fits depends on font metrics, which
     * differ between the arm64 host these baselines are generated on and the
     * amd64 CI runs them on. A whole-page shot therefore moved the tally by a
     * row and failed on a difference that says nothing about this feature.
     * Where it sits is asserted in discardTally.spec.ts instead.
     */
    const tally = page
      .locator("p")
      .filter({ hasText: "Points lost per discard" })
      .locator("..");
    await expect(tally).toHaveScreenshot();
  });

const testScreenshots = () => {
  testInitialRenderScreenshot();
  testEnterCardsDialogScreenshot();
  testPrivacyPolicyScreenshot();
  testScoredPossibilitiesNoExpansionScreenshot();
  testExpandedRowScreenshot();
  testDoubleExpandedScreenshot();
  testCribExpandedScreenshot();
  testDiscardTallyScreenshot();
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
