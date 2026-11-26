import type { Page } from "@playwright/test";

/*
 * Refuses the two deferred sidecar chunks, so every noise verdict falls back
 * to the exact one (#774). The tally counting specs need that: they read
 * "Best choice" as a count of decisions, and a random deal's discard can fall
 * within simulation noise and leave both sides of that ratio.
 */
export const blockUncertaintySidecars = async (page: Page) => {
  await page.route(/Uncertainty-[\w-]+\.js$/u, async (route) => {
    await route.abort();
  });
};
