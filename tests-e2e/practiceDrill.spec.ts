import {
  PRIVACY_POLICY_VERSION,
  analyticsConsentKey,
  answeredPolicyVersionKey,
} from "../src/ui/analyticsConsent";
import { type Page, expect, test } from "@playwright/test";
import {
  phoneLandscapeViewport,
  phonePortraitViewport,
} from "./layoutMeasurements";
import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";
import { blockGoogleAnalytics } from "./blockGoogleAnalytics";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

const LARGE_ROOT_FONT = "html { font-size: 28px; }";

const MISTAKE_HAND_KEY = "5H,6H,7H,8H,9H,10H|Dealer";
const BASE_AT = 1_700_000_000_000;
const ONE_DAY_MS = 86_400_000;
const TWO_DAYS_MS = 172_800_000;
const DECISIONS = 3;
const LOSS_TOTAL = 3.4;
const FIRST_LOSS = 1.9;
const SECOND_LOSS = 1.5;

/*
 * Two sub-optimal hands and one optimal one: enough for the queue to be
 * non-empty, for "Best choice" to read a stable non-trivial ratio, and for
 * the auto-deal sampler to have something to draw.
 */
const SEED_TALLY = {
  lifetime: {
    decisions: DECISIONS,
    expectedPointsLossTotal: LOSS_TOTAL,
    optimalDecisions: 1,
    skippedHands: 0,
  },
  practice: [],
  records: [
    {
      at: BASE_AT,
      cribRole: "Dealer",
      discardKey: "5H,6H",
      expectedPointsLoss: FIRST_LOSS,
      handKey: MISTAKE_HAND_KEY,
      isOptimal: false,
      isPractice: false,
    },
    {
      at: BASE_AT + ONE_DAY_MS,
      cribRole: "Pone",
      discardKey: "AC,2C",
      expectedPointsLoss: SECOND_LOSS,
      handKey: "AC,2C,3C,4C,5C,6C|Pone",
      isOptimal: false,
      isPractice: false,
    },
    {
      at: BASE_AT + TWO_DAYS_MS,
      cribRole: "Dealer",
      discardKey: "KH,KS",
      expectedPointsLoss: 0,
      handKey: "9H,10H,JH,QH,KH,KS|Dealer",
      isOptimal: true,
      isPractice: false,
    },
  ],
  revision: 1,
  skipped: [],
  version: 5,
};

const seedBrowser = (page: Page) =>
  page.addInitScript(
    (stored: {
      readonly consent: Record<string, string>;
      readonly keyPrefix: string;
      readonly tally: typeof SEED_TALLY;
    }) => {
      window.localStorage.setItem(
        stored.keyPrefix + new URL(document.baseURI).pathname,
        JSON.stringify(stored.tally),
      );
      Object.entries(stored.consent).forEach(([key, value]) => {
        window.localStorage.setItem(key, value);
      });
    },
    {
      consent: {
        [analyticsConsentKey]: "false",
        [answeredPolicyVersionKey]: PRIVACY_POLICY_VERSION,
      },
      keyPrefix: DISCARD_TALLY_KEY_PREFIX,
      tally: SEED_TALLY,
    },
  );

const bestChoiceValue = (page: Page) =>
  page
    .getByText(/^\d+\/3 \(/u)
    .last()
    .textContent();

const startDrillOnFirstMistake = async (page: Page) => {
  await page.getByRole("button", { name: "Mistake queue" }).click();
  await page.getByRole("button", { name: "Practice this" }).first().click();
};

const selectTwoDiscards = async (page: Page) => {
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
};

test.describe("practice drill", () => {
  test.beforeEach(async ({ page }) => {
    await blockGoogleAnalytics(page);
    await seedBrowser(page);
    await page.goto("/");
  });

  test("withholds the analysis until the discard is checked, then shows a verdict", async ({
    page,
  }) => {
    await startDrillOnFirstMistake(page);

    await expect(page.getByRole("table")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Check discard" }),
    ).toBeDisabled();

    await selectTwoDiscards(page);
    await page.getByRole("button", { name: "Check discard" }).click();
    await waitForAnalysis(page);

    await expect(page.getByRole("table")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Practice drill" }),
    ).toBeVisible();
  });

  test("a drilled hand leaves the Best choice figure unmoved", async ({
    page,
  }) => {
    const before = await bestChoiceValue(page);

    await startDrillOnFirstMistake(page);
    await selectTwoDiscards(page);
    await page.getByRole("button", { name: "Check discard" }).click();
    await waitForAnalysis(page);
    await page.getByRole("button", { name: "Exit drill" }).click();

    expect(await bestChoiceValue(page)).toBe(before);
  });

  test("mistake queue actions are visible without scrolling on a phone", async ({
    page,
  }) => {
    await page.setViewportSize(phonePortraitViewport);
    await page.getByRole("button", { name: "Mistake queue" }).click();

    const startDrill = page.getByRole("button", { name: "Start drill" });
    await expect(startDrill).toBeVisible();

    const bounds = await startDrill.boundingBox();
    expect(bounds?.y ?? Number.MAX_SAFE_INTEGER).toBeLessThan(
      phonePortraitViewport.height,
    );
  });

  test("drill actions stay on a short landscape screen at a large root font", async ({
    page,
  }) => {
    /*
     * Start the drill at the default viewport where the queue dialog fits,
     * then squeeze to a short landscape with a large root font so the panel's
     * rem rhythm is under test rather than the dialog interaction.
     */
    await startDrillOnFirstMistake(page);
    await page.setViewportSize(phoneLandscapeViewport);
    await page.addStyleTag({ content: LARGE_ROOT_FONT });

    const check = page.getByRole("button", { name: "Check discard" });
    const exit = page.getByRole("button", { name: "Exit drill" });
    await expect(check).toBeVisible();

    const checkBox = await check.boundingBox();
    const exitBox = await exit.boundingBox();
    expect((checkBox?.y ?? 0) + (checkBox?.height ?? 0)).toBeLessThanOrEqual(
      phoneLandscapeViewport.height,
    );
    expect((exitBox?.y ?? 0) + (exitBox?.height ?? 0)).toBeLessThanOrEqual(
      phoneLandscapeViewport.height,
    );
  });

  test("the quality trend table can be scrolled to its rightmost column", async ({
    page,
  }) => {
    await page.setViewportSize(phonePortraitViewport);
    await page.getByRole("button", { name: "Quality trend" }).click();

    const skippedHeader = page.getByRole("columnheader", {
      name: /Skipped/u,
    });
    await skippedHeader.scrollIntoViewIfNeeded();

    await expect(skippedHeader).toBeInViewport();
  });
});
