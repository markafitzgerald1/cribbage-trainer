import { type Page, expect, test } from "@playwright/test";
import {
  constantHandQuery,
  phoneLandscapeViewport,
  phonePortraitViewport,
} from "./layoutMeasurements";
import { blockGoogleAnalytics } from "./blockGoogleAnalytics";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

/*
 * The tally counts a hand's first completed discard and nothing else, and
 * every way it could count more is navigational: the analysis re-renders on a
 * re-sort, on Back, on Forward, and on a reload of the same URL. None of that
 * is reachable from a unit test, because each one is the browser rebuilding
 * the same screen by a different route, which is exactly what makes a second
 * count look legitimate from inside a component.
 */

const DISCARD_COUNT = 2;
/*
 * Anchored on the total, since how many were optimal depends on the deal.
 * Each figure is now its own cell, so the pattern matches a whole cell rather
 * than a phrase, and today's cell carries the same text — which is why the
 * count, not the period, is what these assert.
 * The two counts this spec asserts are spelled out rather than built into a
 * pattern, so no regular expression is assembled from a value.
 */
const ONE_DECISION = /^\d+\/1 \(/u;
const TWO_DECISIONS = /^\d+\/2 \(/u;

/*
 * The last match is the all-time column: today and all time carry the same
 * text within a single session, and it is the lifetime figure these assert.
 */
const decisionsCounted = (page: Page, counted: RegExp) =>
  page.getByText(counted).last();

const selectTwoDiscards = async (page: Page) => {
  const checkboxes = page.getByRole("checkbox");
  for (let index = 0; index < DISCARD_COUNT; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await checkboxes.nth(index).click();
  }
  await waitForAnalysis(page);
};

// An ordinary deal: no seed and no hand parameter, so the decision is authentic.
const playOneAuthenticHand = async (page: Page) => {
  await blockGoogleAnalytics(page);
  await page.goto("/");
  await selectTwoDiscards(page);
};

test("counts one decision per hand however the screen is rebuilt", async ({
  page,
}) => {
  await playOneAuthenticHand(page);
  await expect(decisionsCounted(page, ONE_DECISION)).toBeVisible();

  /*
   * Sorting the analysis re-renders the same completed discard and pushes a
   * history entry. The name is a substring match because the column header's
   * accessible name joins its label and unit, and "Crib" reaches only this
   * one of the four headers.
   */
  await page.getByRole("button", { name: "Crib" }).click();
  await waitForAnalysis(page);
  await expect(decisionsCounted(page, ONE_DECISION)).toBeVisible();

  // Back to the hand before its discard, then Forward onto the same decision.
  await page.goBack();
  await page.goForward();
  await waitForAnalysis(page);
  await expect(decisionsCounted(page, ONE_DECISION)).toBeVisible();

  /*
   * A reload rebuilds the completed discard from its own URL. No component
   * can tell that from a fresh decision, which is why the store rather than
   * the caller is what refuses to count it twice.
   */
  await page.reload();
  await waitForAnalysis(page);
  await expect(decisionsCounted(page, ONE_DECISION)).toBeVisible();
});

test("counts a second hand once it is dealt and discarded", async ({
  page,
}) => {
  await playOneAuthenticHand(page);
  await page.getByRole("button", { exact: true, name: "Deal" }).click();
  await selectTwoDiscards(page);

  await expect(decisionsCounted(page, TWO_DECISIONS)).toBeVisible();
});

/*
 * A seeded, deep-linked hand is study rather than play met blind, so it must
 * leave the average alone. The shared helper's query is exactly that, which
 * is why the guards above cannot use it.
 */
test("leaves a seeded deep link out of the tally", async ({ page }) => {
  await blockGoogleAnalytics(page);
  await page.goto(`/${constantHandQuery}`);
  await selectTwoDiscards(page);

  await expect(page.getByText("Lost per discard")).toBeHidden();
});

/*
 * Where the tally sits, which its screenshots deliberately no longer capture:
 * they shoot the element alone, because a whole-page shot moved with the
 * analysis table's row count across processor architectures.
 */
test("renders the tally between the analysis and the privacy links", async ({
  page,
}) => {
  await playOneAuthenticHand(page);

  const tally = await page.getByText("Lost per discard").boundingBox();
  const table = await page.getByRole("table").boundingBox();
  const privacy = await page
    .getByRole("button", { name: "Privacy Policy" })
    .boundingBox();

  expect(tally?.y).toBeGreaterThan(table?.y ?? 0);
  expect(tally?.y).toBeLessThan(privacy?.y ?? 0);
});

// Above one line but below two, with room for line-height rounding.
const SINGLE_LINE_HEIGHT_RATIO = 1.7;

/*
 * The tally labels are em-sized and share their row with the today and
 * all-time figure columns, which take their width first. A device font-size
 * setting above the default used to grow the labels until "Lost per discard"
 * and "Best choice" wrapped into ragged multi-line cells; each mode's cap
 * keeps them on one line. A wrapped label is ~3x its font size tall, well
 * past the 1.7x bound, so this fails against the uncapped stylesheet.
 */
const expectTallyLabelsUnwrapped = async (page: Page) => {
  await playOneAuthenticHand(page);
  await page.addStyleTag({ content: "html { font-size: 28px; }" });

  const labelMetrics = await Promise.all(
    ["Lost per discard", "Best choice"].map(async (label) => {
      const locator = page.getByText(label, { exact: true });
      const box = await locator.boundingBox();
      const fontSize = await locator.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );
      return { fontSize, height: box?.height ?? Number.NaN };
    }),
  );

  for (const { fontSize, height } of labelMetrics) {
    expect(height).toBeLessThan(fontSize * SINGLE_LINE_HEIGHT_RATIO);
  }
};

test("keeps the tally labels on one line at a large device font", async ({
  page,
}) => {
  await page.setViewportSize(phonePortraitViewport);
  await expectTallyLabelsUnwrapped(page);
});

/*
 * Side-by-side mode has the same trap with a worse consequence: the tally
 * sits in the fixed-height left column, so a wrapped-label height pushes the
 * "Quality trend" / "Mistake queue" buttons off a short phone landscape and
 * out of reach. The landscape cap keeps the labels on one line.
 */
test("keeps the tally labels on one line in landscape at a large device font", async ({
  page,
}) => {
  await page.setViewportSize(phoneLandscapeViewport);
  await expectTallyLabelsUnwrapped(page);
});

/*
 * With a discard chosen, the analysis figure and the tally both take a
 * `grid-row: span 2` slot in column 2, so the tally auto-places into an
 * implicit row past the bottom of a short landscape viewport. The tally
 * font cap does not help — the figure's height is what overflows. A phone
 * whose fixed-height html/body/app chain does not scroll then strands the
 * "Quality trend" / "Mistake queue" buttons off screen (an emulator, whose
 * body does scroll, cannot show this — hence the asserted mechanism rather
 * than button geometry). `.dynamic-ui` becomes its own scroll container so
 * the overflow is reachable there instead of spilling past the app box.
 * Negative-checked: without the rule `.dynamic-ui` overflow is `visible`
 * and its scrollHeight equals its clientHeight.
 */
const SHORT_LANDSCAPE_HEIGHT = 320;

test("gives the landscape dynamic-ui its own scroll when an analysis overflows it", async ({
  page,
}) => {
  await page.setViewportSize({
    height: SHORT_LANDSCAPE_HEIGHT,
    width: phoneLandscapeViewport.width,
  });
  await playOneAuthenticHand(page);
  await page.addStyleTag({ content: "html { font-size: 28px; }" });

  const scrollState = await page
    .locator(".dynamic-ui, [class*='dynamic-ui']")
    .first()
    .evaluate((element) => ({
      canScroll: element.scrollHeight > element.clientHeight,
      overflowY: getComputedStyle(element).overflowY,
    }));

  expect(scrollState.overflowY).toBe("auto");
  expect(scrollState.canScroll).toBe(true);
});
