import { type Locator, type Page, expect, test } from "@playwright/test";
import {
  constantHandQuery,
  exactTextMatch,
  phoneLandscapeViewport,
  phonePortraitViewport,
  poneHandQuery,
  requireBoundingBox,
  requireDealButtonBounds,
  rightEdge,
} from "./layoutMeasurements";
import {
  renderThenSelectTwoDiscards,
  waitForAnalysis,
} from "./renderThenSelectTwoDiscards";

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

const expectDealButtonWithinPortraitViewport = async (
  page: Page,
  rootFontSize?: string,
) => {
  await page.setViewportSize(phonePortraitViewport);
  await page.goto(poneHandQuery);
  if (typeof rootFontSize === "string") {
    await page.addStyleTag({
      content: `html { font-size: ${rootFontSize}; }`,
    });
  }

  const dealBounds = await requireDealButtonBounds(page);

  expect(rightEdge(dealBounds)).toBeLessThanOrEqual(
    phonePortraitViewport.width,
  );
};

test("portrait Pone controls stay within the viewport", async ({ page }) => {
  await expectDealButtonWithinPortraitViewport(page);
});

// Mobile browsers scale rem with the device font-size accessibility setting.
test("portrait Pone controls stay within the viewport at an enlarged root font", async ({
  page,
}) => {
  await expectDealButtonWithinPortraitViewport(page, "28px");
});

const cardMetricsAt = async (
  page: Page,
  viewport: { height: number; width: number },
) => {
  await page.setViewportSize(viewport);
  const firstCard = page.locator("ul").first().locator("label").first();
  const cardBounds = await requireBoundingBox(firstCard);
  const rankBounds = await requireBoundingBox(
    firstCard.locator('span[class*="rank"]').first(),
  );
  return {
    aspectRatio: cardBounds.width / cardBounds.height,
    rankFraction: rankBounds.height / cardBounds.height,
  };
};

const aspectRatioTolerance = 0.01;

// Rank-height fraction tolerates line-height font-metric pixel rounding.
const rankFractionTolerance = 0.02;

const expectMatchingCardMetrics = (
  first: { aspectRatio: number; rankFraction: number },
  second: { aspectRatio: number; rankFraction: number },
) => {
  expect(Math.abs(first.aspectRatio - second.aspectRatio)).toBeLessThanOrEqual(
    aspectRatioTolerance,
  );
  expect(
    Math.abs(first.rankFraction - second.rankFraction),
  ).toBeLessThanOrEqual(rankFractionTolerance);
};

test("stacked-mode card shape and fill are constant across widths", async ({
  page,
}) => {
  await page.goto(poneHandQuery);

  const phoneMetrics = await cardMetricsAt(page, phonePortraitViewport);
  const nearSquareMetrics = await cardMetricsAt(page, {
    height: 1100,
    width: 1200,
  });

  expectMatchingCardMetrics(phoneMetrics, nearSquareMetrics);
});

// Rotating a phone must only rescale the cards, never change their design.
test("card shape and fill survive rotation into side-by-side mode", async ({
  page,
}) => {
  await page.goto(poneHandQuery);

  const portraitMetrics = await cardMetricsAt(page, phonePortraitViewport);
  const landscapeMetrics = await cardMetricsAt(page, {
    height: phonePortraitViewport.width,
    width: phonePortraitViewport.height,
  });

  expectMatchingCardMetrics(portraitMetrics, landscapeMetrics);
});

test("landscape Pone Deal button right edge aligns with the last hand card", async ({
  page,
}) => {
  await page.setViewportSize(phoneLandscapeViewport);
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

test("introduces the app with a heading and purpose tagline", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: expectedTitle }),
  ).toBeVisible();
  await expect(page.getByText(/expected-score analysis/u)).toBeVisible();
});

test("a .css file is linked", async ({ page }) => {
  await page.goto("/");
  expect(await page.$('link[rel="stylesheet"][href$=".css"]')).not.toBeNull();
});

const suitedAnalysisQuery = "?hand=KH,QS,10D,9C,6S,5S";
const suitedDiscardRowText = "K♥Q♠10♦9♣(6♠5♠)";
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
  await waitForAnalysis(page);

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
  await waitForAnalysis(page);

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

const openCardEntryDialog = async (page: Page) => {
  await page.goto("/?seed=manual-entry");
  await page.getByRole("button", { name: "Enter cards" }).click();
};

// Guards against style leaks singling out the grid's first item.
// A global sibling-margin rule once indented every card except the Ace of
// Spades, making it look wider than its peers.
test("card picker buttons share one width and aligned columns", async ({
  page,
}) => {
  await openCardEntryDialog(page);
  const cardButtons = page
    .getByRole("group", { name: "Card choices" })
    .getByRole("button");
  const gridCardCount = 52;
  await expect(cardButtons).toHaveCount(gridCardCount);

  const bounds = await Promise.all(
    Array.from({ length: gridCardCount }, (_, index) =>
      requireBoundingBox(cardButtons.nth(index)),
    ),
  );

  const widths = bounds.map((box) => box.width);
  const geometryTolerance = 1;
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(
    geometryTolerance,
  );

  // The grid flows column-first with 13 rows, so the first 13 share a column.
  const rowsPerColumn = 13;
  const firstColumnLefts = bounds.slice(0, rowsPerColumn).map((box) => box.x);
  expect(
    Math.max(...firstColumnLefts) - Math.min(...firstColumnLefts),
  ).toBeLessThanOrEqual(geometryTolerance);
});

test("manually entered pone hand reaches suited analysis", async ({ page }) => {
  await openCardEntryDialog(page);
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
  await waitForAnalysis(page);

  await expect(getSuitedDiscardRow(page)).toBeVisible();
});

/*
 * The role chips are rem-sized, so a raised device font-size setting widens
 * their row while the dialog does not follow: without `flex-wrap` the row
 * ends at 420.5px on a 390px screen at a 28px root font, and the page's
 * `overflow-x: hidden` means "Pone" cannot be scrolled into reach. Asserting
 * the computed wrap mode alongside the geometry keeps the diagnosis legible
 * if this regresses. The marker pseudo-element is not the cause -- removing
 * it changes the row width by zero -- so do not "fix" it by shrinking
 * markers.
 */
test("entered-hand role chips stay on screen at a large device font", async ({
  page,
}) => {
  await openCardEntryDialog(page);
  await page.setViewportSize(phonePortraitViewport);
  await page.addStyleTag({ content: "html { font-size: 28px; }" });

  const roleGroup = page.getByRole("group", { name: "Your role" });
  const lastChip = roleGroup.getByRole("radio").last().locator("..");

  await expect
    .poll(async () => rightEdge(await requireBoundingBox(lastChip)))
    .toBeLessThanOrEqual(phonePortraitViewport.width);

  // Names the cause when the geometry above regresses.
  await expect(roleGroup).toHaveCSS("flex-wrap", "wrap");
});

/*
 * Guards the structural fix for the close button scrolling away, reported
 * from a real phone: `Modal`'s panel no longer scrolls, an inner element
 * does, so the X stays anchored. Reverting that fails this on both counts.
 * The tile click is the second half of the same fix -- each role radio is
 * `position: absolute`, so a panel that stops scrolling strands them over
 * the card grid, where they intercept clicks meant for the tiles.
 */
test("the close button and card tiles stay usable once the picker scrolls", async ({
  page,
}) => {
  await openCardEntryDialog(page);
  await page.setViewportSize(phonePortraitViewport);

  const closeButton = page.getByRole("button", { name: "Close modal" });
  const beforeScroll = await requireBoundingBox(closeButton);

  /*
   * Scroll the panel itself as well as everything inside it. Scrolling only
   * the descendants made this guard inert: in a build where the panel is the
   * scroll container -- the bug -- nothing moved and every assertion below
   * passed vacuously.
   */
  await closeButton.locator("..").evaluate((panel) => {
    [panel, ...panel.querySelectorAll("div")].forEach((element) => {
      element.scrollTop = element.scrollHeight;
    });
  });

  const afterScroll = await requireBoundingBox(closeButton);

  expect(afterScroll.y).toBeCloseTo(beforeScroll.y, 0);

  /*
   * The seeded hand is already full, so the unselected tiles are disabled and
   * the honest interaction is deselecting one. The count is what proves the
   * click landed: a stranded radio over the grid swallows it, and the dialog
   * still reads "6 of 6".
   */
  await expect(page.getByText("6 of 6")).toBeVisible();

  await page.getByRole("button", { exact: true, name: "Q♠" }).click();

  await expect(page.getByText("5 of 6")).toBeVisible();
});

/*
 * The picker's track minimums are rem, so a raised device font-size setting
 * grows the columns while the modal does not follow. Uncapped, a 28px root on
 * a 390px screen forced 105px columns and put the clubs column's right edge
 * at 499px, panning the dialog sideways by 139px to reach a suit the player
 * has to be able to pick. The right-hand column is the one to assert: the
 * scroll guard above only ever touches the first.
 */
test("every suit column stays on screen at a large device font", async ({
  page,
}) => {
  await openCardEntryDialog(page);
  await page.setViewportSize(phonePortraitViewport);
  await page.addStyleTag({ content: "html { font-size: 28px; }" });

  const clubs = page.getByRole("button", { exact: true, name: "A♣" });

  await expect
    .poll(async () => rightEdge(await requireBoundingBox(clubs)))
    .toBeLessThanOrEqual(phonePortraitViewport.width);
});
