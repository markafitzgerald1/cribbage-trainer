import { type Page, expect, test } from "@playwright/test";
import { SEED_TALLY, openSeededTrainer } from "./practiceDrillSetup";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

/*
 * One best choice and one dealer discard of both diamonds from
 * Q-9-6-6-2-A, whose verdict the tally reads from the admission recorded with
 * it (#774, #894). That hand loses 0.02 under the shipped tables, inside its
 * noise threshold today, so the recorded-mistake case also guards against
 * re-judging stored history with the installed tables and sidecars.
 */
const OPTIMAL = {
  at: 1_700_000_000_000,
  cribRole: "Dealer",
  discardKey: "KH,KS",
  expectedPointsLoss: 0,
  handKey: "9H,10H,JH,QH,KH,KS|Dealer",
  isOptimal: true,
  isPractice: false,
  recordedAdmission: { basis: "exact-v1", eligible: false },
};

const tallyRecording = (eligible: boolean) => ({
  ...SEED_TALLY,
  lifetime: { ...SEED_TALLY.lifetime, decisions: 2 },
  records: [
    OPTIMAL,
    {
      ...OPTIMAL,
      at: OPTIMAL.at + 1,
      discardKey: "QD,2D",
      expectedPointsLoss: 0.016_191,
      handKey: "QD,9S,6S,6H,2D,AH|Dealer",
      isOptimal: false,
      recordedAdmission: { basis: "sampling-noise-v1", eligible },
    },
  ],
  version: 8,
});

const tallyOf = (page: Page) =>
  page.getByText("Avg recorded loss", { exact: true }).locator("..");

test("leaves a decision recorded as within noise out of Best choice and the queue", async ({
  page,
}) => {
  await openSeededTrainer(page, tallyRecording(false));

  await expect(tallyOf(page).getByText(/^1\/1 \(/u)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mistake queue" }),
  ).toBeHidden();
});

test("keeps a recorded mistake that today's tables would call noise", async ({
  page,
}) => {
  await openSeededTrainer(page, tallyRecording(true));
  // A study hand exercises analysis without adding an authentic decision to the seeded ratio.
  await page.goto("/?hand=QD,9S,6S,6H,2D,AH&role=dealer&seed=e2e");
  const sidecars = [
    /CribPointsUncertainty-[\w-]+\.js$/u,
    /PlayPointsUncertainty-[\w-]+\.js$/u,
  ].map((pattern) => page.waitForResponse(pattern));
  await page.getByRole("checkbox", { name: /^Keep Q/u }).click();
  await page.getByRole("checkbox", { name: /^Keep 2/u }).click();
  await waitForAnalysis(page);
  await Promise.all(sidecars);
  await expect(page.locator("figcaption[aria-label]")).toContainText(
    "Within noise",
    { timeout: 20_000 },
  );

  await expect(tallyOf(page).getByText(/^1\/2 \(/u)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mistake queue" }),
  ).toBeVisible();
});
