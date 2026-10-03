import { type Page, expect, test } from "@playwright/test";
import { SEED_TALLY, openSeededTrainer } from "./practiceDrillSetup";
import { blockUncertaintySidecars } from "./blockUncertaintySidecars";

/*
 * One best choice, and a pone discard of the ace and two from A-6 of clubs:
 * a 0.06 loss that the shipped sidecars put inside its threshold (#774).
 * This runs the real tables and the real sidecars, which the unit tests
 * stand in for with uniform errors.
 */
const OPTIMAL = {
  at: 1_700_000_000_000,
  cribRole: "Dealer",
  discardKey: "KH,KS",
  expectedPointsLoss: 0,
  handKey: "9H,10H,JH,QH,KH,KS|Dealer",
  isOptimal: true,
  isPractice: false,
};
const WITHIN_NOISE_TALLY = {
  ...SEED_TALLY,
  lifetime: { ...SEED_TALLY.lifetime, decisions: 2 },
  records: [
    OPTIMAL,
    {
      ...OPTIMAL,
      cribRole: "Pone",
      discardKey: "AC,2C",
      expectedPointsLoss: 0.055813,
      handKey: "AC,2C,3C,4C,5C,6C|Pone",
      isOptimal: false,
    },
  ],
};

/*
 * History is judged only once a recommendation is on screen, so the page
 * opens on a deep-linked hand, which is practice and leaves the tally alone.
 */
const RECOMMENDATION = "/?hand=4H,5D,KH,6H,8C,KC&role=dealer&discard=8C,KC";

const tallyOf = (page: Page) =>
  page.getByText("Lost per discard").locator("..");

// The sidecars are deferred chunks of about 1.5 MB, so each wait gets the room a cold worker needs.
const COLD = { timeout: 20_000 };

test("leaves a within-noise loss out of Best choice and the queue", async ({
  page,
}) => {
  await openSeededTrainer(page, WITHIN_NOISE_TALLY, RECOMMENDATION);

  await expect(tallyOf(page).getByText(/^1\/1 \(/u)).toBeVisible(COLD);
  await expect(
    page.getByRole("button", { name: "Mistake queue" }),
  ).toBeHidden();
});

// The refused request proves the load was attempted, so the settled tally that follows has had its chance to change.
test("keeps the exact verdict when the sidecars cannot load", async ({
  page,
}) => {
  await blockUncertaintySidecars(page);
  const refused = page.waitForRequest(/Uncertainty-/u, COLD);
  await openSeededTrainer(page, WITHIN_NOISE_TALLY, RECOMMENDATION);
  await refused;
  const tally = tallyOf(page);
  await expect(tally).toHaveAttribute("aria-busy", "false", COLD);

  await expect(tally.getByText(/^1\/2 \(/u)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mistake queue" }),
  ).toBeVisible();
});
