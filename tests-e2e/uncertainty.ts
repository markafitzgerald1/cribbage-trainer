import { type Locator, type Page, expect } from "@playwright/test";

/*
 * Both sidecars load only after the ranked results paint, so anything that
 * reads or photographs the expanded row has to wait for them. Without this
 * the three expanded screenshot cases race figures that appear a moment
 * later, and the resulting baselines depend on which side of that race each
 * capture landed on.
 *
 * The wait carries an explicit timeout because `expect` defaults to five
 * seconds where `waitForAnalysis`'s `locator.waitFor` inherits the test's
 * sixty. Without one these are the tightest waits in the suite while waiting
 * on the largest assets in it - a 1.2 MB crib chunk and a 0.3 MB play chunk
 * fetched only after the results paint - so a cold CI worker could fail the
 * guard and all three screenshots before either sidecar arrives.
 */
const DEFERRED_CHUNK_TIMEOUT_MS = 20_000;

// Anchored end to end: a prefix match on the sign alone would quietly take in any later element that starts the same way.
const RENDERED_FIGURE = /^±\d+\.\d\d$/u;

const SPOKEN_FIGURE = /plus or minus \d+\.\d\d simulation error/u;

/*
 * The two totals that carry a published figure. Crib's is a dependence bound
 * over the buckets its weighted average consumed; play's is the standard
 * error of the single record its delta is. Both render the same way, so the
 * guards are shared and only the row differs.
 */
export const CRIB_AVERAGE_ROW = /Crib avg/u;
export const PEG_DELTA_ROW = /You - Opp/u;

export const uncertaintyRow = (page: Page, rowName: RegExp): Locator =>
  page.getByRole("button", { name: rowName });

/*
 * Matched by accessible name on both halves, so the guard covers the
 * accessibility behavior it describes. Reading the DOM text instead would
 * still pass if the spoken phrase were later hidden from the accessibility
 * tree, which is the one failure that would leave a screen reader with no
 * figure at all.
 */
export const spokenUncertainty = (page: Page, rowName: RegExp): Locator =>
  uncertaintyRow(page, rowName).and(
    page.getByRole("button", { name: SPOKEN_FIGURE }),
  );

export const waitForUncertainty = async (page: Page, rowName: RegExp) => {
  await expect(
    uncertaintyRow(page, rowName).getByText(RENDERED_FIGURE),
  ).toBeVisible({
    timeout: DEFERRED_CHUNK_TIMEOUT_MS,
  });
};

/*
 * Both, because a screenshot taken once only one has arrived bakes in
 * whichever side of that race the capture landed on.
 */
export const waitForUncertainties = async (page: Page) => {
  await waitForUncertainty(page, CRIB_AVERAGE_ROW);
  await waitForUncertainty(page, PEG_DELTA_ROW);
};
