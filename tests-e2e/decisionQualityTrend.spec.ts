import { type Page, expect, test } from "@playwright/test";
import { constantHandQuery, phonePortraitViewport } from "./layoutMeasurements";
import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";
import { LARGE_ROOT_FONT } from "./practiceDrillSetup";
import { expectChipsFullyVisible } from "./chipContainment";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";

const GRANULARITY_CHIP_COUNT = 5;
const CRIB_ROLE_CHIP_COUNT = 3;
const YEAR = 2026;
const MONTH = 7;
const START_DAY = 10;
const HOUR = 12;
const SKIP_DAY_ONE = 10;
const SKIP_DAY_TWO = 15;
const SKIP_HOUR = 14;
const DAY_STEP_DIVISOR = 3;
const OPTIMAL_STEP_DIVISOR = 3;
const ROLE_STEP_DIVISOR = 2;
const LOSS_TIER_STEP = 0.25;
const MODULO_TIERS = 4;
const SEED_DECISIONS = 25;
const SEED_OPTIMAL = 9;
const SEED_TOTAL_LOSS = 10.0;
const SEED_SKIPPED = 2;

const selectTrendRadio = async (page: Page, name: string) => {
  const dialog = page
    .getByRole("heading", { name: "Decision quality over time" })
    .locator("..");

  await dialog.getByText(name, { exact: true }).click();
  await expect(dialog.getByRole("radio", { exact: true, name })).toBeChecked();
};

const SEED_TALLY = {
  lifetime: {
    decisions: SEED_DECISIONS,
    expectedPointsLossTotal: SEED_TOTAL_LOSS,
    optimalDecisions: SEED_OPTIMAL,
    skippedHands: SEED_SKIPPED,
  },
  records: Array.from({ length: SEED_DECISIONS }, (_, index) => ({
    at: new Date(
      YEAR,
      MONTH,
      START_DAY + Math.floor(index / DAY_STEP_DIVISOR),
      HOUR,
      0,
      0,
    ).getTime(),
    cribRole: index % ROLE_STEP_DIVISOR === 0 ? "Dealer" : "Pone",
    expectedPointsLoss:
      index % OPTIMAL_STEP_DIVISOR === 0
        ? 0
        : LOSS_TIER_STEP * ((index % MODULO_TIERS) + 1),
    handKey: `h-${index}`,
    isOptimal: index % OPTIMAL_STEP_DIVISOR === 0,
    isPractice: false,
  })),
  revision: 1,
  skipped: [
    { at: new Date(YEAR, MONTH, SKIP_DAY_ONE, SKIP_HOUR, 0, 0).getTime() },
    { at: new Date(YEAR, MONTH, SKIP_DAY_TWO, SKIP_HOUR, 0, 0).getTime() },
  ],
  version: 1,
};

test.describe("decision quality over time trend dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (stored: {
        readonly keyPrefix: string;
        readonly tally: typeof SEED_TALLY;
      }) => {
        window.localStorage.setItem(
          stored.keyPrefix + new URL(document.baseURI).pathname,
          JSON.stringify(stored.tally),
        );
      },
      {
        keyPrefix: DISCARD_TALLY_KEY_PREFIX,
        tally: SEED_TALLY,
      },
    );
    await renderThenSelectTwoDiscards(page, constantHandQuery, true);
  });

  test("opens quality trend dialog and renders summary cards, chart, and breakdown", async ({
    page,
  }) => {
    const trendButton = page.getByRole("button", { name: "Quality trend" });
    await expect(trendButton).toBeVisible();
    await trendButton.click();

    const dialogHeading = page.getByRole("heading", {
      name: "Decision quality over time",
    });
    await expect(dialogHeading).toBeVisible();

    await expect(
      page.getByRole("columnheader", { name: "Decisions" }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { exact: true, name: "20" }),
    ).toBeVisible();

    const chart = page.getByRole("group", {
      name: "Decision quality over time trend chart",
    });
    await expect(chart).toBeVisible();

    await expect(
      page.getByRole("cell", { exact: true, name: "Decisions 6–25" }),
    ).toBeVisible();
  });

  test("switches between period views and updates view", async ({ page }) => {
    await page.getByRole("button", { name: "Quality trend" }).click();

    await selectTrendRadio(page, "Day");
    await selectTrendRadio(page, "Week");
    await selectTrendRadio(page, "Month");
    await expect(page.getByRole("cell", { name: "Aug 2026" })).toBeVisible();

    await selectTrendRadio(page, "Rolling 50");
    await expect(
      page.getByRole("cell", { exact: true, name: "Decisions 1–25" }),
    ).toBeVisible();
  });

  test("filters decisions by crib role", async ({ page }) => {
    await page.getByRole("button", { name: "Quality trend" }).click();

    await selectTrendRadio(page, "Dealer");
    await expect(
      page.getByRole("cell", { exact: true, name: "13" }),
    ).toBeVisible();

    await selectTrendRadio(page, "Pone");
    await expect(
      page.getByRole("cell", { exact: true, name: "12" }),
    ).toBeVisible();
  });

  /*
   * The PR that restyled this dialog measured these groups wrapping to two
   * and four rows at a 28px root font and claimed every chip stays reachable
   * anyway, which is the difference between this dialog and the mistake
   * queue -- there, a group escaped the viewport. Nothing held that claim
   * open, so a future spacing change could push a chip off screen with the
   * gate still green.
   */
  test("keeps the trend filter chips reachable at a large device font", async ({
    page,
  }) => {
    await page.setViewportSize(phonePortraitViewport);
    await page.getByRole("button", { name: "Quality trend" }).click();
    await page.addStyleTag({ content: LARGE_ROOT_FONT });

    await expectChipsFullyVisible(
      page.getByRole("group", { name: "Granularity" }),
      GRANULARITY_CHIP_COUNT,
    );
    await expectChipsFullyVisible(
      page.getByRole("group", { name: "Crib role" }),
      CRIB_ROLE_CHIP_COUNT,
    );
  });

  test("closes dialog with close button and with Escape key", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Quality trend" }).click();
    const dialogHeading = page.getByRole("heading", {
      name: "Decision quality over time",
    });
    await expect(dialogHeading).toBeVisible();

    await page.getByRole("button", { name: "Close modal" }).click();
    await expect(dialogHeading).toBeHidden();

    await page.getByRole("button", { name: "Quality trend" }).click();
    await expect(dialogHeading).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialogHeading).toBeHidden();
  });
});
