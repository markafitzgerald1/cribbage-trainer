import {
  PRIVACY_POLICY_VERSION,
  analyticsConsentKey,
  answeredPolicyVersionKey,
} from "../src/ui/analyticsConsent";
import { type Page, expect } from "@playwright/test";
import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";
import { blockGoogleAnalytics } from "./blockGoogleAnalytics";

export const LARGE_ROOT_FONT = "html { font-size: 28px; }";

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
export const SEED_TALLY = {
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

export const SEED_TALLY_WITH_QUANTILES = {
  ...SEED_TALLY,
  records: [
    ...SEED_TALLY.records,
    {
      at: BASE_AT + TWO_DAYS_MS + ONE_DAY_MS,
      cribRole: "Dealer" as const,
      discardKey: "9H,10H",
      expectedPointsLoss: 2.8,
      handKey: "7H,8H,9H,10H,JH,QH|Dealer",
      isOptimal: false,
      isPractice: false,
    },
  ],
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

export const openSeededTrainer = async (page: Page) => {
  await blockGoogleAnalytics(page);
  await seedBrowser(page);
  await page.goto("/");
};

export const startDrillOnFirstMistake = async (page: Page) => {
  await page.getByRole("button", { name: "Mistake queue" }).click();
  await page.getByRole("button", { name: "Practice this" }).first().click();
};

export const selectTwoDiscards = async (page: Page) => {
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
};

export const expectActionWithinViewport = async (
  page: Page,
  name: string,
  viewportHeight: number,
) => {
  const button = page.getByRole("button", { name });
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    viewportHeight,
  );
};
