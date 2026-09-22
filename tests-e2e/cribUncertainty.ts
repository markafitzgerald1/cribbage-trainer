import { type Locator, type Page, expect } from "@playwright/test";

/*
 * The sidecar loads only after the ranked results paint, so anything that
 * reads or photographs the expanded row has to wait for it. Without this the
 * three expanded screenshot cases race a figure that appears a moment later,
 * and the resulting baseline depends on which side of that race the capture
 * landed on.
 *
 * The wait carries an explicit timeout because `expect` defaults to five
 * seconds where `waitForAnalysis`'s `locator.waitFor` inherits the test's
 * sixty. Without one this is the tightest wait in the suite while waiting on
 * the largest asset in it - a 1.2 MB chunk fetched only after the results
 * paint - so a cold CI worker could fail the guard and all three screenshots
 * before the sidecar arrives.
 */
const DEFERRED_CHUNK_TIMEOUT_MS = 20_000;

// Anchored end to end: a prefix match on the sign alone would quietly take in any later element that starts the same way.
const RENDERED_BOUND = /^±\d+\.\d\d$/u;

const SPOKEN_BOUND = /plus or minus \d+\.\d\d simulation error/u;

export const cribAverageRow = (page: Page): Locator =>
  page.getByRole("button", { name: /Crib avg/u });

/*
 * By accessible name, so the guard covers the accessibility behavior it
 * describes. Reading the DOM text instead would still pass if the spoken
 * phrase were later hidden from the accessibility tree, which is the one
 * failure that would leave a screen reader with no figure at all.
 */
export const spokenCribUncertainty = (page: Page): Locator =>
  page.getByRole("button", { name: SPOKEN_BOUND });

export const waitForCribUncertainty = async (page: Page) => {
  await expect(cribAverageRow(page).getByText(RENDERED_BOUND)).toBeVisible({
    timeout: DEFERRED_CHUNK_TIMEOUT_MS,
  });
};
