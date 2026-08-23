import { type Page, expect, test } from "@playwright/test";
import { blockGoogleAnalytics } from "./blockGoogleAnalytics";
import { constantHandQuery } from "./layoutMeasurements";
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
 * The two counts this spec asserts are spelled out rather than built into a
 * pattern, so no regular expression is assembled from a value.
 */
const ONE_DECISION = /Best choice \d+ of 1$/u;
const TWO_DECISIONS = /Best choice \d+ of 2$/u;

const decisionsCounted = (page: Page, counted: RegExp) =>
  page.getByText(counted);

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

  await expect(page.getByText("Average cost")).toBeHidden();
});
