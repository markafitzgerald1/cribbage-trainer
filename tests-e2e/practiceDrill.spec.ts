import { type Locator, type Page, expect, test } from "@playwright/test";
import {
  PRIVACY_POLICY_VERSION,
  analyticsConsentKey,
  answeredPolicyVersionKey,
} from "../src/ui/analyticsConsent";
import {
  phoneLandscapeViewport,
  phonePortraitViewport,
} from "./layoutMeasurements";
import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";
import { blockGoogleAnalytics } from "./blockGoogleAnalytics";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

const LARGE_ROOT_FONT = "html { font-size: 28px; }";
// Same-row tolerance for the filter chips: sub-pixel drift, not a wrapped row.
const CHIP_ROW_TOLERANCE_PX = 2;
const SORT_BY_CHIP_COUNT = 3;
/*
 * How much shorter than the emulated landscape viewport a real phone is once
 * its address and gesture bars are showing — the gap that hid the first
 * mistake on hardware while a 390px emulator kept it on screen.
 */
const REAL_CHROME_HEIGHT_PX = 50;

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

  const expectActionWithinViewport = async (
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

    await expectActionWithinViewport(
      page,
      "Start drill",
      phonePortraitViewport.height,
    );
  });

  const expectChipsOnOneRow = async (chips: Locator, expectedCount: number) => {
    await expect(chips).toHaveCount(expectedCount);
    const tops = await Promise.all(
      (await chips.all()).map(async (chip) => {
        const box = await chip.boundingBox();
        expect(box).not.toBeNull();
        return box?.y ?? Number.NaN;
      }),
    );

    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(
      CHIP_ROW_TOLERANCE_PX,
    );
  };

  test("keeps the mistake-queue sort chips on one row at a large device font", async ({
    page,
  }) => {
    await page.setViewportSize(phonePortraitViewport);
    await page.getByRole("button", { name: "Mistake queue" }).click();
    await page.addStyleTag({ content: LARGE_ROOT_FONT });

    /*
     * A 28px device font used to wrap a chip's label ("Most recent") or push
     * a whole chip onto a second row; the portrait cap keeps all three on one
     * line. Negative-checked: without it "Most recent" drops a row and its
     * top diverges from the other two by well over 2px.
     */
    const sortBy = page.getByRole("group", { name: "Sort by" });
    await expectChipsOnOneRow(sortBy.locator("label"), SORT_BY_CHIP_COUNT);
  });

  test("shows the first mistake without scrolling in phone landscape", async ({
    page,
  }) => {
    /*
     * A real phone's address and gesture bars leave less height than the
     * plain emulated landscape viewport — roughly 50px here — which is why
     * the reporter saw the first mistake off screen where an emulator at 390
     * did not. The queue header (title, action bar, subtitle, summary cards,
     * four filter groups) is what filled that shorter box. The landscape
     * media block drops the subtitle and tightens the header spacing so the
     * top mistake's loss badge is on screen at once. Negative-checked:
     * without that block the badge sits below the viewport here.
     */
    const shortHeight = phoneLandscapeViewport.height - REAL_CHROME_HEIGHT_PX;
    await page.setViewportSize({
      height: shortHeight,
      width: phoneLandscapeViewport.width,
    });
    await page.getByRole("button", { name: "Mistake queue" }).click();

    const lossBadge = page.getByText(/pts lost/u).first();
    await expect(lossBadge).toBeVisible();
    const box = await lossBadge.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(shortHeight);
  });

  test("scrolls the mistake-queue filters away in landscape, keeping the action bar", async ({
    page,
  }) => {
    await page.setViewportSize(phoneLandscapeViewport);
    await page.getByRole("button", { name: "Mistake queue" }).click();

    /*
     * On a real phone a second sticky row of four filter groups below the
     * action bar left no room for even one full mistake. Landscape now
     * matches portrait: only the action bar stays pinned, the filters
     * scroll away with the content. Negative-checked: the filter row reads
     * `sticky` without the rule.
     */
    const filterRowPosition = await page
      .getByRole("group", { name: "Sort by" })
      .evaluate((group) =>
        group.parentElement
          ? getComputedStyle(group.parentElement).position
          : null,
      );
    const actionBarPosition = await page
      .getByRole("button", { name: "Start drill" })
      .evaluate((button) =>
        button.parentElement
          ? getComputedStyle(button.parentElement).position
          : null,
      );

    expect(filterRowPosition).toBe("static");
    expect(actionBarPosition).toBe("sticky");
  });

  test("counts no skip for the board hand when a drill starts", async ({
    page,
  }) => {
    await startDrillOnFirstMistake(page);

    /*
     * Regression: replacing the undecided board hand to enter practice used
     * to charge it a skip, which surfaces this row — it renders only once a
     * skip has been recorded, and SEED_TALLY starts with none.
     */
    await expect(page.getByText("Hands skipped")).toHaveCount(0);
  });

  test("drill actions stay on a short landscape screen at a large root font", async ({
    page,
  }) => {
    /*
     * Start the drill at the default viewport where the queue dialog fits,
     * then squeeze to a short landscape with a large root font so the panel's
     * rem rhythm is under test rather than the dialog interaction. The
     * choosing state keeps its buttons on screen; the taller revealed state
     * puts its actions first and caps the panel height so Draw another /
     * Exit stay visible while the Now / Before comparison and the outcome
     * line stay reachable by scrolling the panel.
     */
    await startDrillOnFirstMistake(page);
    await page.setViewportSize(phoneLandscapeViewport);
    await page.addStyleTag({ content: LARGE_ROOT_FONT });

    await expectActionWithinViewport(
      page,
      "Check discard",
      phoneLandscapeViewport.height,
    );
    await expectActionWithinViewport(
      page,
      "Exit drill",
      phoneLandscapeViewport.height,
    );

    await selectTwoDiscards(page);
    await page.getByRole("button", { name: "Check discard" }).click();
    await waitForAnalysis(page);

    await expectActionWithinViewport(
      page,
      "Draw another",
      phoneLandscapeViewport.height,
    );
    await expectActionWithinViewport(
      page,
      "Exit drill",
      phoneLandscapeViewport.height,
    );

    /*
     * The panel caps its own height and scrolls, so its box stays within the
     * viewport (rather than the outcome line being clipped by Trainer's
     * non-scrolling column) and the Now / Before comparison and outcome are
     * reachable by scrolling the panel itself.
     */
    const panel = page.getByRole("region", { name: "Practice drill" });
    const panelBox = await panel.boundingBox();
    expect((panelBox?.y ?? 0) + (panelBox?.height ?? 0)).toBeLessThanOrEqual(
      phoneLandscapeViewport.height,
    );
    const panelOverflows = await panel.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    );
    expect(panelOverflows).toBe(true);

    const outcome = page.getByText(
      /toward mastery|behind the best discard|Mastered/u,
    );
    await outcome.scrollIntoViewIfNeeded();
    await expect(outcome).toBeInViewport();
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

  test("the quality trend table stays reachable below the chart on a short screen", async ({
    page,
  }) => {
    await page.setViewportSize(phoneLandscapeViewport);
    await page.getByRole("button", { name: "Quality trend" }).click();

    const table = page.getByRole("table");
    /*
     * The dialog scrolls its own overflow on a short landscape viewport, and a
     * flex item that is itself a scroll container has an automatic minimum
     * size of zero: without `flex-shrink: 0` the wrapper collapsed to no
     * height once the chart filled the dialog, putting the whole table out of
     * reach rather than merely scrolled past.
     */
    const wrapperHeight = await table.evaluate(
      (element) => element.parentElement?.clientHeight ?? 0,
    );
    expect(wrapperHeight).toBeGreaterThan(0);

    const firstBucketRow = table.locator("tbody tr").first();
    await firstBucketRow.scrollIntoViewIfNeeded();

    await expect(firstBucketRow).toBeInViewport();
  });
});
