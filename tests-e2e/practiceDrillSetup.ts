import { type Locator, type Page, expect } from "@playwright/test";
import {
  PRIVACY_POLICY_VERSION,
  analyticsConsentKey,
  answeredPolicyVersionKey,
} from "../src/ui/analyticsConsent";
import {
  phonePortraitViewport,
  requireBoundingBox,
} from "./layoutMeasurements";
import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";
import { blockGoogleAnalytics } from "./blockGoogleAnalytics";
import { originalIdentity } from "../src/ui-react/PracticeDrillPanel.test.common";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

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

const seedBrowser = (page: Page, tally: unknown) =>
  page.addInitScript(
    (stored: {
      readonly consent: Record<string, string>;
      readonly keyPrefix: string;
      readonly tally: unknown;
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
      tally,
    },
  );

export const openSeededTrainer = async (
  page: Page,
  tally: unknown = SEED_TALLY,
) => {
  await blockGoogleAnalytics(page);
  await seedBrowser(page, tally);
  await page.goto("/");
};

export const startDrillOnFirstMistake = async (page: Page) => {
  await page.getByRole("button", { name: "Mistake queue" }).click();
  // This seeded mistake's asynchronous comparison moves its action as the badge arrives.
  await expect(
    page.getByRole("note", { name: /^Current-table comparison:/u }).first(),
  ).toBeVisible();
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
  /*
   * Both edges: `toBeVisible` says rendered, not on screen, and bounding
   * only the bottom lets an action scrolled clean above the viewport pass.
   */
  expect(box?.y ?? Number.NaN).toBeGreaterThanOrEqual(0);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    viewportHeight,
  );
};

export const openEarlierTableTrainer = (page: Page) =>
  openSeededTrainer(page, {
    ...SEED_TALLY,
    records: SEED_TALLY.records.map((record) => ({
      ...record,
      tableIdentity: originalIdentity,
    })),
    version: 8,
  });

export const expectPanelActionReachable = async (page: Page, name: string) => {
  const panel = page.getByRole("region", { name: "Practice drill" });
  const [bounds, panelBounds] = await Promise.all([
    requireBoundingBox(panel.getByRole("button", { name })),
    requireBoundingBox(panel),
  ]);
  expect(bounds.y).toBeGreaterThanOrEqual(panelBounds.y);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(
    panelBounds.y + panelBounds.height,
  );
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(
    page.viewportSize()?.height ?? Number.NaN,
  );
  const action = panel.getByRole("button", { name });
  if (await action.isEnabled()) await action.click({ trial: true });
};

export const expectChangedPanelReachable = async (page: Page) => {
  await expectPanelActionReachable(page, "Draw another");
  await expectPanelActionReachable(page, "Exit drill");
  const panel = page.getByRole("region", { name: "Practice drill" });
  const note = panel.getByText(/Tables changed since this decision/u);
  await note.scrollIntoViewIfNeeded();
  await expect(note).toBeInViewport();
  await panel.evaluate((element) => {
    element.scrollTop = 0;
  });
};

export const reviewAtLargePortrait = async (page: Page) => {
  await openEarlierTableTrainer(page);
  await startDrillOnFirstMistake(page);
  await page.setViewportSize(phonePortraitViewport);
  await page.addStyleTag({ content: LARGE_ROOT_FONT });
  await expectPanelActionReachable(page, "Check discard");
  await expectPanelActionReachable(page, "Exit drill");
  await selectTwoDiscards(page);
  await page.getByRole("button", { name: "Check discard" }).click();
  await waitForAnalysis(page);
};

export const expectPanelContentReachable = async (
  panel: Locator,
  content: Locator,
) => {
  const panelBefore = await requireBoundingBox(panel);
  const scroll = await content.evaluate((element) => {
    const region = element.closest("section") as HTMLElement;
    const bounds = element.getBoundingClientRect();
    const panelBounds = region.getBoundingClientRect();
    const clipped =
      bounds.top < panelBounds.top || bounds.bottom > panelBounds.bottom;
    const before = region.scrollTop;
    const centerDivisor = 2;
    if (region.scrollHeight > region.clientHeight) {
      region.scrollTop +=
        bounds.top -
        panelBounds.top -
        (region.clientHeight - bounds.height) / centerDivisor;
    }
    return { after: region.scrollTop, before, clipped };
  });
  if (scroll.clipped) expect(scroll.after).not.toBe(scroll.before);
  const contentBounds = await requireBoundingBox(content);
  const panelAfter = await requireBoundingBox(panel);
  expect(panelAfter).toEqual(panelBefore);
  expect(contentBounds.y).toBeGreaterThanOrEqual(panelAfter.y);
  expect(contentBounds.y + contentBounds.height).toBeLessThanOrEqual(
    panelAfter.y + panelAfter.height,
  );
  const childrenFit = await content.evaluate((element) => {
    const panelBounds = (
      element.closest("section") as HTMLElement
    ).getBoundingClientRect();
    return [...element.querySelectorAll("*")].every((child) => {
      const bounds = child.getBoundingClientRect();
      return (
        bounds.top >= panelBounds.top &&
        bounds.bottom <= panelBounds.bottom &&
        bounds.left >= panelBounds.left &&
        bounds.right <= panelBounds.right
      );
    });
  });
  expect(childrenFit).toBe(true);
  await expect(content).toBeInViewport({ ratio: 1 });
};

export const expectPracticeComparisonsReachable = async (panel: Locator) => {
  const labels = ["Retry — current tables", "Then — recorded cost"];
  await labels.reduce(async (previous, label) => {
    await previous;
    await expectPanelContentReachable(
      panel,
      panel.getByText(label).locator(".."),
    );
  }, Promise.resolve());
};
