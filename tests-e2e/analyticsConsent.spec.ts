import {
  GOOGLE_TAG_SELECTOR,
  blockGoogleAnalytics,
} from "./blockGoogleAnalytics";
import { type Page, expect, test } from "@playwright/test";
import { analyticsConsentKey } from "../src/ui/analyticsConsent";

const analyticsCookieNames = async (page: Page) =>
  (await page.context().cookies())
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("_ga"));

const useTrainer = async (page: Page) => {
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
  await page.getByRole("button", { exact: true, name: "Deal" }).click();
};

const expectNothingSentToGoogle = async (
  page: Page,
  googleRequests: readonly string[],
) => {
  expect(googleRequests).toStrictEqual([]);
  expect(await page.evaluate(() => "dataLayer" in window)).toBe(false);
  expect(await page.locator(GOOGLE_TAG_SELECTOR).count()).toBe(0);
  expect(await analyticsCookieNames(page)).toStrictEqual([]);
};

const startTrainer = async (page: Page) => {
  const googleRequests = await blockGoogleAnalytics(page);
  await page.goto("/");
  return googleRequests;
};

test("sends nothing to Google Analytics while consent is unanswered", async ({
  page,
}) => {
  const googleRequests = await startTrainer(page);

  await useTrainer(page);

  await expectNothingSentToGoogle(page, googleRequests);
});

test("sends nothing to Google Analytics after declining", async ({ page }) => {
  const googleRequests = await startTrainer(page);

  await page.getByRole("button", { exact: true, name: "Decline" }).click();
  await useTrainer(page);

  await expectNothingSentToGoogle(page, googleRequests);
});

// Without this the tests above would also pass if the tag could never load at all, which is the failure mode that let a consent defect hide.
test("loads the tag once analytics is accepted", async ({ page }) => {
  const googleRequests = await startTrainer(page);

  await page.getByRole("button", { exact: true, name: "Accept" }).click();

  await expect.poll(() => googleRequests.length).toBeGreaterThan(0);
  expect(await page.evaluate(() => "dataLayer" in window)).toBe(true);
});

const policyUpdateHeading = (page: Page) =>
  page.getByRole("heading", { name: "Analytics Consent Update" });

// A browser that answered the policy in force before decision-quality collection existed.
test("asks about the policy update without disturbing the consent already given", async ({
  page,
}) => {
  const googleRequests = await blockGoogleAnalytics(page);
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "true");
  }, analyticsConsentKey);
  await page.goto("/");

  await expect(policyUpdateHeading(page)).toBeVisible();
  await expect.poll(() => googleRequests.length).toBeGreaterThan(0);

  await page.getByRole("button", { exact: true, name: "Decline" }).click();

  await expect(policyUpdateHeading(page)).toBeHidden();
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      analyticsConsentKey,
    ),
  ).toBe("true");
});
