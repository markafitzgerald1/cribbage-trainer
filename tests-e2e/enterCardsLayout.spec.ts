import { expect, test } from "@playwright/test";
import {
  phonePortraitViewport,
  requireBoundingBox,
  rightEdge,
} from "./layoutMeasurements";
import { openCardEntryDialog } from "./openCardEntryDialog";

/*
 * Enter-cards layout under a raised device font-size setting. Split out of
 * `index.spec.ts` when that file reached the 520-line cap; these share a
 * subject -- the dialog under a root font that grows while the modal
 * does not -- so they read better together than appended there anyway.
 */
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

  /*
   * One tile from each end of the row: `CARD_GRID_SUIT_ORDER` runs spades
   * through clubs, so clubs is the rightmost column and spades the
   * leftmost. Measuring both edges of the same tile proves nothing about
   * the far column -- a grid clipped on the left keeps the clubs tile
   * wholly on screen.
   */
  const clubs = page.getByRole("button", { exact: true, name: "A♣" });
  const spades = page.getByRole("button", { exact: true, name: "A♠" });

  await expect
    .poll(async () => rightEdge(await requireBoundingBox(clubs)))
    .toBeLessThanOrEqual(phonePortraitViewport.width);
  await expect
    .poll(async () => (await requireBoundingBox(spades)).x)
    .toBeGreaterThanOrEqual(0);
});

/*
 * The suit-column test above measures the tile boxes, which the track cap
 * keeps inside the screen -- but the label is laid out independently, and
 * capping the column while leaving `font-size` in bare rem let the text
 * outgrow its own tile: at a 36px root font "10♣" measured 80px inside a 65px
 * tile and spilled 7.5px into the next column. Measure the rendered glyphs
 * with a Range, since the button's own box stays put while its text escapes.
 */
test("card labels stay inside their tiles at a large device font", async ({
  page,
}) => {
  await openCardEntryDialog(page);
  await page.setViewportSize(phonePortraitViewport);
  await page.addStyleTag({ content: "html { font-size: 36px; }" });

  const worstOverflow = await page
    .getByRole("group", { name: "Card choices" })
    .evaluate((grid) =>
      Array.from(grid.querySelectorAll("button")).reduce((worst, tile) => {
        const range = document.createRange();
        range.selectNodeContents(tile);
        return Math.max(
          worst,
          range.getBoundingClientRect().right -
            tile.getBoundingClientRect().right,
        );
      }, Number.NEGATIVE_INFINITY),
    );

  expect(worstOverflow).toBeLessThanOrEqual(0);
});
