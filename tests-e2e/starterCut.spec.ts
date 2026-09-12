import { type Page, expect, test } from "@playwright/test";
import { CARDS_PER_DEALT_HAND } from "../src/game/facts";
import { blockGoogleAnalytics } from "./blockGoogleAnalytics";
import { constantHandQuery } from "./layoutMeasurements";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

const CUT_SEED_QUERY = "/?seed=starter-cut-guard";
const CUT_PANEL_NAME = "Starter cut outcome";
const DISCARD_COUNT = 2;

// Display positions in the default descending sort of KH,QS,10D,9C,6S,5H.
const INDEX_OF_KING = 0;
const INDEX_OF_SIX = 4;

const handLocator = (page: Page) => page.locator("ul").first();

const cutPanel = (page: Page) =>
  page.getByRole("region", { name: CUT_PANEL_NAME });

const starterText = async (page: Page) => {
  const starter = cutPanel(page).locator('[class*="starter-card"]');
  await starter.waitFor({ state: "visible" });
  return starter.textContent();
};

const requireHandText = async (page: Page) => {
  // The six cards are the signal here, so wait for all of them rather than for the first paint.
  await expect(page.getByRole("checkbox")).toHaveCount(CARDS_PER_DEALT_HAND);
  const text = await handLocator(page).textContent();
  if (text === null) {
    throw new Error("the dealt hand rendered no text");
  }
  return text;
};

const selectTwoDiscards = async (page: Page) => {
  const checkboxes = page.getByRole("checkbox");
  for (let index = 0; index < DISCARD_COUNT; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await checkboxes.nth(index).click();
  }
  await waitForAnalysis(page);
};

const dealAgain = async (page: Page, previousHandText: string) => {
  await page.getByRole("button", { exact: true, name: "Deal" }).click();
  await expect(handLocator(page)).not.toHaveText(previousHandText);
  return requireHandText(page);
};

const dealTwiceShowingACut = async (page: Page) => {
  await page.goto(CUT_SEED_QUERY);
  const first = await requireHandText(page);
  await selectTwoDiscards(page);
  await expect(cutPanel(page)).toBeVisible();
  return [first, await dealAgain(page, first)];
};

const dealTwiceWithoutACut = async (page: Page) => {
  await page.goto(CUT_SEED_QUERY);
  const first = await requireHandText(page);
  return [first, await dealAgain(page, first)];
};

/*
 * Two runs of the same seeded session differing only in whether a cut was
 * computed in between. The starter is derived from the dealt cards rather than
 * drawn (`src/game/cutStarter.ts`), so the generator's position is untouched
 * and the second deal must match. A starter drawn from the shared generator
 * would advance it in the first run only, and the second hands would diverge —
 * the failure #717 calls out as silent, because nothing else in the app would
 * complain about it.
 *
 * Negative-checked against a build that deliberately consumed one generator
 * draw per completed discard: this fails there, on the second hand.
 */
test("a seeded session deals the same hands whether or not a cut was shown", async ({
  page,
}) => {
  await blockGoogleAnalytics(page);

  const withCut = await dealTwiceShowingACut(page);
  const withoutCut = await dealTwiceWithoutACut(page);

  expect(withCut).toStrictEqual(withoutCut);
});

test("a hand keeps the same starter across reloads", async ({ page }) => {
  await blockGoogleAnalytics(page);
  await page.goto(`/${constantHandQuery}&discard=6S,5H`);
  await waitForAnalysis(page);
  const before = await starterText(page);

  await page.reload();
  await waitForAnalysis(page);

  expect(await starterText(page)).toBe(before);
});

/*
 * The cut is a function of the six dealt cards and not of the discard, so
 * changing the discard cannot re-roll it. Without that, a user could shop for
 * a flattering cut by toggling cards, which is the behavior the deterministic
 * choice exists to prevent.
 */
test("changing the discard does not re-roll the starter", async ({ page }) => {
  await blockGoogleAnalytics(page);
  await page.goto(`/${constantHandQuery}&discard=6S,5H`);
  await waitForAnalysis(page);
  const before = await starterText(page);

  await page.getByRole("checkbox").nth(INDEX_OF_SIX).click();
  await page.getByRole("checkbox").nth(INDEX_OF_KING).click();
  await waitForAnalysis(page);

  expect(await starterText(page)).toBe(before);
});
