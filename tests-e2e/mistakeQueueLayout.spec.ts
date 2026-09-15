import {
  LARGE_ROOT_FONT,
  SEED_TALLY_WITH_QUANTILES,
  expectActionWithinViewport,
  openSeededTrainer,
} from "./practiceDrillSetup";
import { type Locator, type Page, expect, test } from "@playwright/test";
import {
  phoneLandscapeViewport,
  phonePortraitViewport,
} from "./layoutMeasurements";
import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";

// Same-row tolerance for the filter chips: sub-pixel drift, not a wrapped row.
const CHIP_ROW_TOLERANCE_PX = 2;
const SORT_BY_CHIP_COUNT = 3;
const LOSS_SEVERITY_CHIP_COUNT = 4;
/*
 * How much shorter than the emulated landscape viewport a real phone is once
 * its address and gesture bars are showing — the gap that hid the first
 * mistake on hardware while a 390px emulator kept it on screen.
 */
const REAL_CHROME_HEIGHT_PX = 50;

test.describe("mistake queue layout", () => {
  test.beforeEach(async ({ page }) => {
    await openSeededTrainer(page);
  });

  const boxOf = async (locator: Locator) => {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    return {
      bottom: (box?.y ?? Number.NaN) + (box?.height ?? Number.NaN),
      left: box?.x ?? Number.NaN,
      right: (box?.x ?? Number.NaN) + (box?.width ?? Number.NaN),
      top: box?.y ?? Number.NaN,
    };
  };

  /*
   * Every chip must be legible in full, which is a different claim from
   * fitting on one row -- and the stronger one. An earlier version of this
   * guard asserted a single row, and the non-wrapping scroll strip that
   * satisfied it cropped "Low < 0.31" to "Low < 0.3" behind a scroll strip
   * nobody notices. So: assert each chip is whole inside its group and the
   * group is inside the viewport, and say nothing about how many rows that
   * takes.
   */
  /*
   * Only for groups whose wrapping would be a regression. Loss severity wraps
   * on purpose, so it uses the visibility helper alone; Sort by is held on one
   * row by the portrait sizing caps, and a wrap there means those caps have
   * slipped. Horizontal containment cannot see that, since wrapped chips are
   * still fully inside their group.
   */
  const expectChipsShareARow = async (group: Locator) => {
    const tops = await Promise.all(
      (await group.locator("label").all()).map(
        async (chip) => (await boxOf(chip)).top,
      ),
    );

    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(
      CHIP_ROW_TOLERANCE_PX,
    );
  };

  const expectChipsFullyVisible = async (
    group: Locator,
    expectedCount: number,
  ) => {
    const chips = group.locator("label");
    await expect(chips).toHaveCount(expectedCount);

    const viewportWidth = group.page().viewportSize()?.width ?? Number.NaN;
    const groupBox = await boxOf(group);

    expect(groupBox.left).toBeGreaterThanOrEqual(-CHIP_ROW_TOLERANCE_PX);
    expect(groupBox.right).toBeLessThanOrEqual(
      viewportWidth + CHIP_ROW_TOLERANCE_PX,
    );

    const chipBoxes = await Promise.all(
      (await chips.all()).map(async (chip) => boxOf(chip)),
    );

    /*
     * Both axes: `boundingBox` still reports geometry for a chip an ancestor
     * has clipped, so checking only the horizontal edges would miss a group
     * whose height cannot hold the rows it wrapped onto. Measured against the
     * group rather than the viewport on purpose -- this panel scrolls, so a
     * group below the fold is reachable rather than broken.
     */
    chipBoxes.forEach((chipBox) => {
      expect(chipBox.left).toBeGreaterThanOrEqual(
        groupBox.left - CHIP_ROW_TOLERANCE_PX,
      );
      expect(chipBox.right).toBeLessThanOrEqual(
        groupBox.right + CHIP_ROW_TOLERANCE_PX,
      );
      expect(chipBox.top).toBeGreaterThanOrEqual(
        groupBox.top - CHIP_ROW_TOLERANCE_PX,
      );
      expect(chipBox.bottom).toBeLessThanOrEqual(
        groupBox.bottom + CHIP_ROW_TOLERANCE_PX,
      );
    });
  };

  const openMistakeQueueAtLargeFont = async (page: Page) => {
    await page.setViewportSize(phonePortraitViewport);
    await page.getByRole("button", { name: "Mistake queue" }).click();
    await page.addStyleTag({ content: LARGE_ROOT_FONT });
  };

  test("mistake queue actions are visible without scrolling on a phone", async ({
    page,
  }) => {
    await page.setViewportSize(phonePortraitViewport);
    await page.getByRole("button", { name: "Mistake queue" }).click();

    await expectActionWithinViewport(
      page,
      "Start drill",
      phonePortraitViewport.height,
    );
  });

  test("keeps every mistake-queue sort chip fully visible at a large device font", async ({
    page,
  }) => {
    await openMistakeQueueAtLargeFont(page);

    /*
     * A 28px device font used to wrap a chip's label ("Most recent") or push
     * a whole chip onto a second row; the portrait cap keeps all three on one
     * line. Negative-checked: without it "Most recent" drops a row and its
     * top diverges from the other two by well over 2px.
     */
    const sortBy = page.getByRole("group", { name: "Sort by" });
    await expectChipsFullyVisible(sortBy, SORT_BY_CHIP_COUNT);
    await expectChipsShareARow(sortBy);
  });

  test("keeps every mistake-queue loss severity chip fully visible at a large device font", async ({
    page,
  }) => {
    await page.evaluate(
      ({ keyPrefix, tally }) => {
        window.localStorage.setItem(
          keyPrefix + new URL(document.baseURI).pathname,
          JSON.stringify(tally),
        );
      },
      {
        keyPrefix: DISCARD_TALLY_KEY_PREFIX,
        tally: SEED_TALLY_WITH_QUANTILES,
      },
    );
    await openMistakeQueueAtLargeFont(page);

    const lossSeverity = page.getByRole("group", { name: "Loss severity" });
    await expectChipsFullyVisible(lossSeverity, LOSS_SEVERITY_CHIP_COUNT);
  });

  test("shows the first mistake without scrolling in phone landscape", async ({
    page,
  }) => {
    /*
     * A real phone's address and gesture bars leave less height than the
     * plain emulated landscape viewport — roughly 50px here — which is why
     * the reporter saw the first mistake off screen where an emulator at 390
     * did not. The queue header (title, action bar, subtitle, summary cards,
     * four filter groups) is what filled that shorter box. The landscape
     * media block drops the subtitle and tightens the header spacing so the
     * top mistake's loss badge is on screen at once. Negative-checked:
     * without that block the badge sits below the viewport here.
     */
    const shortHeight = phoneLandscapeViewport.height - REAL_CHROME_HEIGHT_PX;
    await page.setViewportSize({
      height: shortHeight,
      width: phoneLandscapeViewport.width,
    });
    await page.getByRole("button", { name: "Mistake queue" }).click();

    const lossBadge = page.getByText(/pts lost/u).first();
    await expect(lossBadge).toBeVisible();
    const box = await lossBadge.boundingBox();
    expect(box).not.toBeNull();
    /*
     * A badge entirely above the scrollport also has a bottom under the
     * viewport height, so the top edge is half of this claim.
     */
    expect(box?.y ?? Number.NaN).toBeGreaterThanOrEqual(0);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(shortHeight);
  });

  test("scrolls the mistake-queue filters away in landscape, keeping the action bar", async ({
    page,
  }) => {
    await page.setViewportSize(phoneLandscapeViewport);
    await page.getByRole("button", { name: "Mistake queue" }).click();

    /*
     * On a real phone a second sticky row of four filter groups below the
     * action bar left no room for even one full mistake. Landscape now
     * matches portrait: only the action bar stays pinned, the filters
     * scroll away with the content. Negative-checked: the filter row reads
     * `sticky` without the rule.
     */
    const filterRowPosition = await page
      .getByRole("group", { name: "Sort by" })
      .evaluate((group) =>
        group.parentElement
          ? getComputedStyle(group.parentElement).position
          : null,
      );
    const actionBarPosition = await page
      .getByRole("button", { name: "Start drill" })
      .evaluate((button) =>
        button.parentElement
          ? getComputedStyle(button.parentElement).position
          : null,
      );

    expect(filterRowPosition).toBe("static");
    expect(actionBarPosition).toBe("sticky");
  });
});
