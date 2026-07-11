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

const poneHandQuery = "/?hand=KH,QS,10D,9C,6S,5H&role=pone";

const requireBoundingBox = async (locator: Locator) => {
  const bounds = await locator.boundingBox();
  if (bounds === null) {
    throw new Error("Bounding box is unavailable");
  }
  return bounds;
};

const requireDealButtonBounds = (page: Page) =>
  requireBoundingBox(page.getByRole("button", { name: /^Deal$/u }));

const rightEdge = (bounds: { width: number; x: number }) =>
  bounds.x + bounds.width;

test("portrait Pone controls stay within the viewport", async ({ page }) => {
  const portraitViewport = { height: 844, width: 390 };
  await page.setViewportSize(portraitViewport);
  await page.goto(poneHandQuery);

  const dealBounds = await requireDealButtonBounds(page);

  expect(rightEdge(dealBounds)).toBeLessThanOrEqual(portraitViewport.width);
});

test("landscape Pone Deal button right edge aligns with the last hand card", async ({
  page,
}) => {
  const landscapePhoneViewport = { height: 390, width: 844 };
  await page.setViewportSize(landscapePhoneViewport);
  await page.goto(poneHandQuery);

  const dealBounds = await requireDealButtonBounds(page);
  const lastCardBounds = await requireBoundingBox(
    page.locator("ul").first().locator("label").last(),
  );

  const alignmentTolerance = 1;
  expect(
    Math.abs(rightEdge(dealBounds) - rightEdge(lastCardBounds)),
  ).toBeLessThanOrEqual(alignmentTolerance);
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

const expectBreakdownLabelsVisible = async (container: Locator) => {
  await Promise.all(
    expectedBreakdownLabels.map(async (label) => {
      await expect(container.getByText(label, exactTextMatch)).toBeVisible();
    }),
  );
};

test("pre-cut hand points show after select of two discards", async ({
  page,
}) => {
  await renderThenSelectTwoDiscards(page, constantHandQuery);

  await expect(page.getByRole("button", { name: "Hand" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Crib" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Net" })).toBeVisible();
});

const ascendingSuitedDiscardRowText = "9♣10♦Q♠K♥(5♠6♠)";

test("deep link hydrates hand, role, discards, sort order, and analysis sort", async ({
  page,
}) => {
  await page.goto(
    `/${suitedAnalysisQuery}&role=pone&discard=6S,5S&sort=ascending&analysis-sort=hand`,
  );

  await expect(page.getByText("Pone", exactTextMatch)).toBeVisible();
  await expect(
    page
      .locator('tr[class*="highlighted"]')
      .filter({ hasText: ascendingSuitedDiscardRowText }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "Ascending" })).toBeChecked();
  await expect(
    page.getByRole("columnheader", { name: /Hand/u }),
  ).toHaveAttribute("aria-sort", "descending");
});

const constantHandText = "K♥Q♠10♦9♣6♠5♥";

test("browser back skips transient discards and steps between dealt hands", async ({
  page,
}) => {
  await page.goto(`/${constantHandQuery}`);
  const hand = page.locator("ul").first();
  const firstCheckbox = page.getByRole("checkbox").first();

  await expect(hand).toHaveText(constantHandText);

  await firstCheckbox.click();
  await expect(page).toHaveURL(/discard=KH/u);

  await page.getByRole("checkbox").nth(1).click();
  await expect(page).toHaveURL(/discard=KH,QS/u);

  await page.goBack();
  await expect(page).not.toHaveURL(/discard=/u);
  await expect(firstCheckbox).toBeChecked();

  await page.getByRole("button", { name: "Deal" }).click();
  await expect(hand).not.toHaveText(constantHandText);

  await page.goBack();
  await expect(hand).toHaveText(constantHandText);

  await page.goForward();
  await expect(hand).not.toHaveText(constantHandText);
});

test("a discard mind-change does not leave a blank history entry", async ({
  page,
}) => {
  await page.goto(`/${constantHandQuery}`);
  const hand = page.locator("ul").first();
  await expect(hand).toHaveText(constantHandText);
  const initialHistoryLength = await page.evaluate(() => window.history.length);
  const firstCheckbox = page.getByRole("checkbox").first();

  await firstCheckbox.click();
  await expect(page).toHaveURL(/discard=KH/u);

  await firstCheckbox.click();
  await expect(page).not.toHaveURL(/discard=/u);

  await page.getByRole("button", { name: "Deal" }).click();
  await expect(hand).not.toHaveText(constantHandText);

  // A leftover duplicate entry would make this length grow by two.
  expect(await page.evaluate(() => window.history.length)).toBe(
    initialHistoryLength + 1,
  );

  await page.goBack();
  await expect(hand).toHaveText(constantHandText);
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

  await expectBreakdownLabelsVisible(
    page
      .locator('div[class*="breakdown-header"]')
      .filter({ hasText: "Points" }),
  );
  await expect(page.getByText("+Cut avg")).toBeVisible();

  await page.getByText("+Cut avg").click();

  await expect(
    page.locator('div[class*="cut-result-row"]').first(),
  ).toBeVisible();

  await page.getByText("Crib avg").click();

  await expect(page.getByText("7♠")).toBeVisible();
  await expect(page.getByText("7 (♣♦♥)")).toBeVisible();
});

test("exact six-fifths aspect ratio keeps analysis beside the hand", async ({
  page,
}) => {
  const sixFifthsBoundaryViewport = { height: 1000, width: 1200 };
  await page.setViewportSize(sixFifthsBoundaryViewport);
  await renderThenSelectTwoDiscards(page, constantHandQuery);

  const handBounds = await requireBoundingBox(page.locator("figure").first());
  const tableBounds = await requireBoundingBox(page.getByRole("table"));

  expect(tableBounds.x).toBeGreaterThanOrEqual(rightEdge(handBounds));
});

test("manually entered pone hand reaches suited analysis", async ({ page }) => {
  await page.goto("/?seed=manual-entry");
  await page.getByRole("button", { name: "Enter cards" }).click();
  const dialog = page
    .getByRole("heading", { name: "Enter cards" })
    .locator("..");

  const selectedCards = dialog.getByRole("button", { pressed: true });
  const dealtCardCount = 6;
  await Array.from({ length: dealtCardCount }).reduce<Promise<void>>(
    (click) => click.then(() => selectedCards.first().click()),
    Promise.resolve(),
  );
  await ["K♥", "Q♠", "10♦", "9♣", "6♠", "5♠"].reduce(
    (click, card) =>
      click.then(() => dialog.getByRole("button", { name: card }).click()),
    Promise.resolve(),
  );
  await dialog.getByRole("radio", { name: "Pone" }).click();
  await dialog.getByRole("button", { name: "Use hand" }).click();

  await expect(page).toHaveURL(/hand=KH,QS,10D,9C,6S,5S/u);
  await expect(page).toHaveURL(/role=pone/u);

  const sixIndex = 4;
  const fiveIndex = 5;
  await page.getByRole("checkbox").nth(sixIndex).click();
  await page.getByRole("checkbox").nth(fiveIndex).click();

  await expect(getSuitedDiscardRow(page)).toBeVisible();
});
