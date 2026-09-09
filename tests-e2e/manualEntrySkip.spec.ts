import { type Page, expect, test } from "@playwright/test";
import { blockGoogleAnalytics } from "./blockGoogleAnalytics";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

/*
 * Replacing the untouched startup hand through Enter cards once recorded that
 * hand as a skip (#755): `useDiscardTally` charged the outgoing authentic hand
 * before it read the `manual` cause that marks the incoming one as practice.
 * #768 fixed it by excluding `manual` from the skip test, alongside the drill
 * work — so the guard there (`practiceDrill.spec.ts`) only exercises the drill
 * entry point. These cover the Enter-cards path and the dismiss case the
 * issue's acceptance criteria name, and pin that Deal is still counted so the
 * guard cannot be widened to swallow it.
 *
 * None of these may seed the session: `?seed=…` makes the startup hand
 * practice, which cannot be skipped, so the shared Enter-cards helpers that
 * use `?seed=manual-entry` are unusable here.
 */

const ENTERED_HAND = ["A♠", "2♠", "3♠", "4♠", "5♠", "6♠"] as const;
const DISCARD_COUNT = 2;

// Rendered only once a skip exists, so its absence is the assertion.
const skippedRow = (page: Page) => page.getByText("Hands skipped");

/*
 * The all-time skipped figure — `count/faced`, with a share span the
 * stylesheet may drop. `.last()` is the all-time column. Anchored on an
 * exact `1/1` so the Deal case pins "one skip", not merely "a skip".
 */
const ONE_SKIP_OF_ONE = /^1\/1\b/u;

const startAuthenticHand = async (page: Page) => {
  await blockGoogleAnalytics(page);
  await page.goto("/");
};

/*
 * A completed discard on whichever hand is now on screen: it renders the
 * analysis table (so the app has demonstrably settled) and records the
 * decision, which is the point at which a wrongly-charged skip for the
 * outgoing hand would already be in storage.
 */
const completeADiscard = async (page: Page) => {
  const checkboxes = page.getByRole("checkbox");
  await ENTERED_HAND.slice(0, DISCARD_COUNT).reduce<Promise<void>>(
    (click, _card, index) => click.then(() => checkboxes.nth(index).click()),
    Promise.resolve(),
  );
  await waitForAnalysis(page);
};

const openEnterCards = async (page: Page) => {
  await page.getByRole("button", { name: "Enter cards" }).click();
  return page.getByRole("heading", { name: "Enter cards" }).locator("..");
};

test("replacing an untouched authentic hand via Enter cards records no skip", async ({
  page,
}) => {
  await startAuthenticHand(page);
  const dialog = await openEnterCards(page);

  await dialog.getByRole("button", { name: "Clear" }).click();
  await ENTERED_HAND.reduce(
    (click, card) =>
      click.then(() => dialog.getByRole("button", { name: card }).click()),
    Promise.resolve(),
  );
  await dialog.getByRole("button", { name: "Use hand" }).click();
  await expect(page).toHaveURL(/hand=AS,2S,3S,4S,5S,6S/u);

  await completeADiscard(page);

  await expect(skippedRow(page)).toHaveCount(0);
});

test("dismissing Enter cards on an untouched authentic hand records no skip", async ({
  page,
}) => {
  await startAuthenticHand(page);
  await openEnterCards(page);
  await page.getByRole("button", { name: "Close modal" }).click();

  await completeADiscard(page);

  await expect(skippedRow(page)).toHaveCount(0);
});

test("dealing a fresh hand from an untouched authentic hand records exactly one skip", async ({
  page,
}) => {
  await startAuthenticHand(page);
  await page.getByRole("button", { exact: true, name: "Deal" }).click();

  await expect(skippedRow(page)).toHaveCount(1);
  await expect(page.getByText(ONE_SKIP_OF_ONE).last()).toBeVisible();
});
