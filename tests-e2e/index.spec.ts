import { type Locator, type Page, expect, test } from "@playwright/test";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";

const expectedHtmlLanguage = "en";

test(`HTML language '${expectedHtmlLanguage}' is specified`, async ({
  page,
}) => {
  await page.goto("/");
  expect(await page.$(`html[lang="${expectedHtmlLanguage}"]`)).not.toBeNull();
});

const expectedCharset = "utf-8";

test(`HTML charset '${expectedCharset}' is specified`, async ({ page }) => {
  await page.goto("/");
  expect(await page.$(`meta[charset="${expectedCharset}"]`)).not.toBeNull();
});

test("standard mobile viewport is specified", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    "width=device-width, initial-scale=1",
  );
});

const expectedTitle = "Cribbage Trainer";

test(`has title '${expectedTitle}'`, async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(expectedTitle);
});

test("a .css file is linked", async ({ page }) => {
  await page.goto("/");
  expect(await page.$('link[rel="stylesheet"][href$=".css"]')).not.toBeNull();
});

const constantHandQuery = "?hand=KH,QS,10D,9C,6S,5H&seed=e2e";
const suitedAnalysisQuery = "?hand=KH,QS,10D,9C,6S,5S";
const suitedDiscardRowText = "K♥Q♠10♦9♣(6♠5♠)";
const exactTextMatch = { exact: true };
const expectedBreakdownLabels = [
  "15s",
  "Pairs",
  "Runs",
  "Flushes",
  "Nobs",
  "Total",
] as const;

const getSuitedDiscardRow = (page: Page) =>
  page
    .locator('tr[class*="highlighted"]')
    .filter({ hasText: suitedDiscardRowText });

const expectBreakdownLabelsVisible = async (tbody: Locator) => {
  await Promise.all(
    expectedBreakdownLabels.map(async (label) => {
      await expect(tbody.getByText(label, exactTextMatch)).toBeVisible();
    }),
  );
};

test("pre-cut hand points show after select of two discards", async ({
  page,
}) => {
  await renderThenSelectTwoDiscards(page, constantHandQuery);

  await expect(page.getByRole("button", { name: "E(h)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "E(c)" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /E\(h[+-]c\)/u }),
  ).toBeVisible();
});

test("semantic e2e suited analysis flow", async ({ page }) => {
  await page.goto(`/${suitedAnalysisQuery}`);

  const indexOf6S = 4;
  const indexOf5S = 5;
  await page.getByRole("checkbox").nth(indexOf6S).click();
  await page.getByRole("checkbox").nth(indexOf5S).click();

  const row = getSuitedDiscardRow(page);
  await expect(row).toBeVisible();

  await row.click();

  await expectBreakdownLabelsVisible(page.locator("tbody"));
  await expect(page.getByText("+Cut avg")).toBeVisible();

  await page.getByText("+Cut avg").click();

  await expect(
    page.locator('div[class*="cut-result-row"]').first(),
  ).toBeVisible();

  await page.getByText("Crib avg").click();

  await expect(page.getByText("7♠")).toBeVisible();
  await expect(page.getByText("7 (♣♦♥)")).toBeVisible();
});
