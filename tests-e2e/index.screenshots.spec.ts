import {
  DIFFERENT_TABLE_IDENTITY,
  openRetryMistakeQueue,
} from "./mistakeQueueCardSetup";
import { expect, test } from "@playwright/test";
import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";
import { constantHandQuery } from "./layoutMeasurements";
import { openSeededTrainer } from "./practiceDrillSetup";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";
import { waitForUncertainties } from "./uncertainty";

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

const SUB_OPTIMAL_CARD_INDEX = 4;
const SUB_OPTIMAL_DISCARD_INDICES: readonly [number, number] = [
  0,
  SUB_OPTIMAL_CARD_INDEX,
];

const testSubOptimalDiscardScreenshot = () =>
  test("sub-optimal discard shows diagnostic caption still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, constantHandQuery, {
      acceptAnalytics: true,
      discardIndices: SUB_OPTIMAL_DISCARD_INDICES,
    });

    await expect(page).toHaveScreenshot();
  });

const TIED_OPTIMAL_CARD_INDEX = 5;
const TIED_OPTIMAL_HAND_QUERY = "?hand=9D,9C,9H,4C,4H,3S&role=pone&seed=e2e";
const TIED_OPTIMAL_DISCARD_INDICES: readonly [number, number] = [
  0,
  TIED_OPTIMAL_CARD_INDEX,
];

const testTiedOptimalDiscardScreenshot = () =>
  test("tied optimal discard shows margin and equal-best tiers still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, TIED_OPTIMAL_HAND_QUERY, {
      acceptAnalytics: true,
      discardIndices: TIED_OPTIMAL_DISCARD_INDICES,
    });

    await expect(page).toHaveScreenshot();
  });

const testExpandedRowScreenshot = () =>
  test("scored possibilities with one row expanded still visually the same", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);

    await page.locator("tbody tr").first().click();
    await waitForUncertainties(page);

    await expect(page).toHaveScreenshot();
  });

const testBreakdownExpandedScreenshot = (
  title: string,
  breakdown: string | RegExp,
) =>
  test(title, async ({ page }) => {
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);

    await page.locator("tbody tr").first().click();
    await waitForUncertainties(page);
    await page.getByRole("button", { name: breakdown }).click();

    await expect(page).toHaveScreenshot();
  });

const testDoubleExpandedScreenshot = () =>
  testBreakdownExpandedScreenshot(
    "starter details show after double expansion still visually the same",
    "+Cut avg",
  );

const testCribExpandedScreenshot = () =>
  testBreakdownExpandedScreenshot(
    "crib starter details show after crib avg expansion still visually the same",
    "Crib avg",
  );

// The pegging breakdown starts closed (#805), so only this view shows it open.
const testPlayExpandedScreenshot = () =>
  testBreakdownExpandedScreenshot(
    "pegging details show after you minus opp expansion still visually the same",
    /You - Opp/u,
  );

/*
 * The expanded row alone, with "Opening plays" open, once per seat. The row
 * rather than the page so the shot does not depend on how many analysis rows
 * the clipped table fits above it.
 */
const testOpeningPlaysScreenshot = (role: "dealer" | "pone") =>
  test(`opening plays as ${role} still visually the same`, async ({ page }) => {
    await renderThenSelectTwoDiscards(
      page,
      `?hand=KH,QS,10D,9C,6S,5H&role=${role}&seed=e2e`,
      true,
    );

    await page.locator("tbody tr").first().click();
    await waitForUncertainties(page);
    await page
      .getByRole("button", { exact: true, name: "Opening plays" })
      .click();
    await expect(
      page.getByText("Mixing leads is deliberate.", { exact: false }),
    ).toBeVisible();
    await page.mouse.move(0, 0);

    await expect(page.locator("tbody tr").nth(1)).toHaveScreenshot();
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
  test("recorded discard tally", async ({ page }) => {
    await page.addInitScript(
      /*
       * The key is built in the browser, because it carries the deployment's
       * own base path and only the page knows what that is.
       */
      (stored: {
        readonly best: number;
        readonly keyPrefix: string;
        readonly lifetime: unknown;
        readonly losses: readonly number[];
      }) => {
        window.localStorage.setItem(
          stored.keyPrefix + new URL(document.baseURI).pathname,
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
        keyPrefix: DISCARD_TALLY_KEY_PREFIX,
        lifetime: STORED_TALLY_LIFETIME,
        losses: TODAY_LOSSES,
      },
    );
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);
    await expect(
      page.getByRole("button", { exact: true, name: "Mistake queue" }),
    ).toBeVisible();

    /*
     * The tally itself rather than the page. It sits below a clipped analysis
     * table, and how many rows that table fits depends on font metrics, which
     * differ between the arm64 host these baselines are generated on and the
     * amd64 CI runs them on. A whole-page shot therefore moved the tally by a
     * row and failed on a difference that says nothing about this feature.
     * Where it sits is asserted in discardTally.spec.ts instead.
     */
    const tally = page
      .getByText("Avg recorded loss", { exact: true })
      .locator("..");
    await expect(tally).toHaveScreenshot();
  });

const testScreenshots = () => {
  testInitialRenderScreenshot();
  testEnterCardsDialogScreenshot();
  testPrivacyPolicyScreenshot();
  testScoredPossibilitiesNoExpansionScreenshot();
  testSubOptimalDiscardScreenshot();
  testTiedOptimalDiscardScreenshot();
  testExpandedRowScreenshot();
  testDoubleExpandedScreenshot();
  testCribExpandedScreenshot();
  testPlayExpandedScreenshot();
  testDiscardTallyScreenshot();
  test("mistake queue retry card keeps badge rows and point units together", async ({
    page,
  }) => {
    await openSeededTrainer(page);
    const card = await openRetryMistakeQueue(page);
    await expect(
      card.getByRole("note", { name: /^Current-table comparison:/u }),
    ).toBeVisible();
    await expect(card).toHaveScreenshot();
  });
  test("mistake queue table fingerprints expand for bug reports", async ({
    page,
  }) => {
    await openSeededTrainer(page);
    const card = await openRetryMistakeQueue(page, DIFFERENT_TABLE_IDENTITY);
    await expect(
      card.getByRole("note", { name: /^Current-table comparison:/u }),
    ).toBeVisible();
    await card
      .getByText("Judged with different tables", { exact: true })
      .click();
    await expect(
      card.getByRole("note", {
        name: "Crib table fingerprint 4cd8a9258d32",
      }),
    ).toBeVisible();
    await expect(card).toHaveScreenshot();
  });
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

// Taller than a phone so the dealer's ten rows and the footer fit inside the clipped analysis table.
test.describe("opening plays", () => {
  test.use({ viewport: { height: 1100, width: 390 } });

  testOpeningPlaysScreenshot("pone");
  testOpeningPlaysScreenshot("dealer");
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
