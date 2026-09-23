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

/*
 * The two totals that carry a published figure, each with the phrase a screen
 * reader should hear for it. They render the same glyph because the Total
 * column has room for nothing else, so the spoken text is the only place the
 * distinction lives: crib's figure is a dependence bound over the buckets its
 * weighted average consumed, play's is one published record's own standard
 * error and omits a policy term of unpublished size. A shared phrase would
 * announce them as the same quantity, so these are pinned separately and
 * asserted against the row they belong to.
 */
export const CRIB_AVERAGE_ROW = {
  name: /Crib avg/u,
  spoken: /plus or minus \d+\.\d\d, a bound on the combined simulation error/u,
};

export const PEG_DELTA_ROW = {
  name: /You - Opp/u,
  spoken:
    /plus or minus \d+\.\d\d from simulation randomness, not counting uncertainty in the simulated pegging strategy/u,
};

export type UncertaintyRow = typeof CRIB_AVERAGE_ROW;

export const uncertaintyRow = (page: Page, row: UncertaintyRow): Locator =>
  page.getByRole("button", { name: row.name });

/*
 * Matched by accessible name on both halves, so the guard covers the
 * accessibility behavior it describes. Reading the DOM text instead would
 * still pass if the spoken phrase were later hidden from the accessibility
 * tree, which is the one failure that would leave a screen reader with no
 * figure at all.
 */
export const spokenUncertainty = (page: Page, row: UncertaintyRow): Locator =>
  uncertaintyRow(page, row).and(page.getByRole("button", { name: row.spoken }));

export const waitForUncertainty = async (page: Page, row: UncertaintyRow) => {
  await expect(
    uncertaintyRow(page, row).getByText(RENDERED_FIGURE),
  ).toBeVisible({
    timeout: DEFERRED_CHUNK_TIMEOUT_MS,
  });
};

/*
 * Both, because a screenshot taken once only one has arrived bakes in
 * whichever side of that race the capture landed on.
 */
export const waitForUncertainties = async (page: Page) => {
  /*
   * Concurrently, because the two loads are: awaiting them in turn would put
   * two 20-second budgets in series against a 60-second test timeout, and a
   * cold CI worker parsing multi-megabyte chunks is exactly the case those
   * timeouts exist for.
   */
  await Promise.all([
    waitForUncertainty(page, CRIB_AVERAGE_ROW),
    waitForUncertainty(page, PEG_DELTA_ROW),
  ]);
};
