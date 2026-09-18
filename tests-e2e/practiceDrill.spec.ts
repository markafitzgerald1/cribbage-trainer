import {
  LARGE_ROOT_FONT,
  expectActionWithinViewport,
  openSeededTrainer,
  selectTwoDiscards,
  startDrillOnFirstMistake,
} from "./practiceDrillSetup";
import { type Page, expect, test } from "@playwright/test";
import {
  phoneLandscapeViewport,
  phonePortraitViewport,
  requireBoundingBox,
} from "./layoutMeasurements";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

const bestChoiceValue = (page: Page) =>
  page
    .getByText(/^\d+\/3 \(/u)
    .last()
    .textContent();

test.describe("practice drill", () => {
  test.beforeEach(async ({ page }) => {
    await openSeededTrainer(page);
  });

  test("withholds the analysis until the discard is checked, then shows a verdict", async ({
    page,
  }) => {
    /*
     * Render the analysis once on the board hand before drilling. Two things
     * would otherwise make the absence below trivial and the guard inert: an
     * incomplete discard hides the table on its own, and the table is lazily
     * loaded, so it is also missing while its chunk resolves. Showing it
     * first settles both -- the chunk is loaded and this page has proved it
     * renders a complete discard -- so afterwards only withholding explains
     * an empty board. Negative-checked: without this the sabotaged build
     * passed in four of five projects.
     */
    await selectTwoDiscards(page);
    await waitForAnalysis(page);
    await expect(page.getByRole("table")).toBeVisible();

    await startDrillOnFirstMistake(page);

    const checkDiscard = page.getByRole("button", { name: "Check discard" });
    await expect(checkDiscard).toBeDisabled();

    await selectTwoDiscards(page);

    await expect(checkDiscard).toBeEnabled();
    await expect(page.getByRole("table")).toBeHidden();

    await checkDiscard.click();
    await waitForAnalysis(page);

    await expect(page.getByRole("table")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Practice drill" }),
    ).toBeVisible();
  });

  test("a drilled hand leaves the Best choice figure unmoved", async ({
    page,
  }) => {
    const before = await bestChoiceValue(page);

    await startDrillOnFirstMistake(page);
    await selectTwoDiscards(page);
    await page.getByRole("button", { name: "Check discard" }).click();
    await waitForAnalysis(page);
    await page.getByRole("button", { name: "Exit drill" }).click();

    expect(await bestChoiceValue(page)).toBe(before);
  });

  test("counts no skip for the board hand when a drill starts", async ({
    page,
  }) => {
    await startDrillOnFirstMistake(page);

    /*
     * Regression: replacing the undecided board hand to enter practice used
     * to charge it a skip, which surfaces this row — it renders only once a
     * skip has been recorded, and SEED_TALLY starts with none.
     */
    await expect(page.getByText("Hands skipped")).toHaveCount(0);
  });

  test("drill actions stay on a short landscape screen at a large root font", async ({
    page,
  }) => {
    /*
     * Start the drill at the default viewport where the queue dialog fits,
     * then squeeze to a short landscape with a large root font so the panel's
     * rem rhythm is under test rather than the dialog interaction. The
     * choosing state keeps its buttons on screen; the taller revealed state
     * puts its actions first and caps the panel height so Draw another /
     * Exit stay visible while the Now / Before comparison and the outcome
     * line stay reachable by scrolling the panel.
     */
    await startDrillOnFirstMistake(page);
    await page.setViewportSize(phoneLandscapeViewport);
    await page.addStyleTag({ content: LARGE_ROOT_FONT });

    await expectActionWithinViewport(
      page,
      "Check discard",
      phoneLandscapeViewport.height,
    );
    await expectActionWithinViewport(
      page,
      "Exit drill",
      phoneLandscapeViewport.height,
    );

    await selectTwoDiscards(page);
    await page.getByRole("button", { name: "Check discard" }).click();
    await waitForAnalysis(page);

    await expectActionWithinViewport(
      page,
      "Draw another",
      phoneLandscapeViewport.height,
    );
    await expectActionWithinViewport(
      page,
      "Exit drill",
      phoneLandscapeViewport.height,
    );

    /*
     * The panel caps its own height and scrolls, so its box stays within the
     * viewport (rather than the outcome line being clipped by Trainer's
     * non-scrolling column) and the Now / Before comparison and outcome are
     * reachable by scrolling the panel itself.
     */
    const panel = page.getByRole("region", { name: "Practice drill" });
    const panelBox = await panel.boundingBox();
    expect((panelBox?.y ?? 0) + (panelBox?.height ?? 0)).toBeLessThanOrEqual(
      phoneLandscapeViewport.height,
    );
    const panelOverflows = await panel.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    );
    expect(panelOverflows).toBe(true);

    const outcome = page.getByText(
      /toward mastery|behind the best discard|Mastered/u,
    );
    await outcome.scrollIntoViewIfNeeded();
    await expect(outcome).toBeInViewport();
  });

  /*
   * Jest/jsdom never evaluates the `@media (aspect-ratio >= 6 / 5)` rule
   * that hides this note, so a media-query regression could silently put
   * the extra row back into the height-constrained landscape panel without
   * any unit test catching it.
   */
  test("shows the suit-reshuffled note in portrait, hides it in landscape", async ({
    page,
  }) => {
    await page.setViewportSize(phonePortraitViewport);
    await startDrillOnFirstMistake(page);

    const suitNote = page.getByText("Suits reshuffled for this drill.");
    await expect(suitNote).toBeVisible();

    await page.setViewportSize(phoneLandscapeViewport);

    await expect(suitNote).toBeHidden();
  });

  test("the quality trend table can be scrolled to its rightmost column", async ({
    page,
  }) => {
    await page.setViewportSize(phonePortraitViewport);
    await page.getByRole("button", { name: "Quality trend" }).click();

    const skippedHeader = page.getByRole("columnheader", {
      name: /Skipped/u,
    });
    await skippedHeader.scrollIntoViewIfNeeded();

    await expect(skippedHeader).toBeInViewport();
  });

  test("the quality trend table stays reachable below the chart on a short screen", async ({
    page,
  }) => {
    await page.setViewportSize(phoneLandscapeViewport);
    await page.getByRole("button", { name: "Quality trend" }).click();

    const table = page.getByRole("table");
    /*
     * The dialog scrolls its own overflow on a short landscape viewport, and a
     * flex item that is itself a scroll container has an automatic minimum
     * size of zero: without `flex-shrink: 0` the wrapper collapsed to no
     * height once the chart filled the dialog, putting the whole table out of
     * reach rather than merely scrolled past.
     */
    const wrapperHeight = await table.evaluate(
      (element) => element.parentElement?.clientHeight ?? 0,
    );
    expect(wrapperHeight).toBeGreaterThan(0);

    const firstBucketRow = table.locator("tbody tr").first();
    await firstBucketRow.scrollIntoViewIfNeeded();

    await expect(firstBucketRow).toBeInViewport();
  });

  /*
   * In practice drill mode on a portrait phone, the drill panel sits directly
   * above the analysis table. Tightened caption gaps, padding, and font sizes
   * scoped to .in-drill ensure the diagnostic caption does not wrap and multiple
   * discard rows remain visible within the table container without scrolling.
   */
  test("diagnostic caption and multiple analysis rows stay visible during drill review at large root font in portrait", async ({
    page,
  }) => {
    await startDrillOnFirstMistake(page);
    await page.setViewportSize(phonePortraitViewport);
    await page.addStyleTag({ content: LARGE_ROOT_FONT });

    await selectTwoDiscards(page);
    await page.getByRole("button", { name: "Check discard" }).click();
    await waitForAnalysis(page);

    const analysisFigure = page
      .locator("figure")
      .filter({ has: page.getByRole("table") });
    const caption = analysisFigure.locator("figcaption");
    await expect(caption).toBeInViewport();

    // The tightened in-drill caption styles keep the diagnostic caption compact.
    const maxCompactCaptionHeight = 65;
    const captionBox = await requireBoundingBox(caption);
    expect(captionBox.height).toBeLessThan(maxCompactCaptionHeight);

    // At least two analysis rows remain visible within the viewport and scroll area.
    const tableContainer = analysisFigure.locator(
      "[class*='table-container'], [class*='tableContainer']",
    );
    const rows = tableContainer.locator("tbody tr");
    await expect(rows.nth(0)).toBeInViewport();
    await expect(rows.nth(1)).toBeInViewport();

    const minTwoRowsContainerHeight = 95;
    const containerBox = await requireBoundingBox(tableContainer);
    expect(containerBox.height).toBeGreaterThan(minTwoRowsContainerHeight);
  });
});
