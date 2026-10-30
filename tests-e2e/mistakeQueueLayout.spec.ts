import {
  LARGE_ROOT_FONT,
  SEED_TALLY_WITH_QUANTILES,
  expectActionWithinViewport,
  openSeededTrainer,
} from "./practiceDrillSetup";
import { type Page, expect, test } from "@playwright/test";
import {
  applyViewportSize,
  phoneLandscapeViewport,
  phonePortraitViewport,
} from "./layoutMeasurements";
import {
  expectChipsFullyVisible,
  expectChipsShareARow,
} from "./chipContainment";
import {
  measureRetryCard,
  openRetryMistakeQueue,
} from "./mistakeQueueCardSetup";
import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";

const NARROW_PHONE_WIDTH = 375;
const WIDE_PHONE_WIDTH = 430;
const DEFAULT_ROOT_FONT_PX = 16;
const LARGE_ROOT_FONT_PX = 28;
const TWO = 2;
const TABLET_VIEWPORT = { height: 1024, width: 768 };
const DESKTOP_VIEWPORT = { height: 900, width: 1440 };

const centerY = (box: { y: number; height: number } | null) =>
  (box?.y ?? Number.NaN) + (box?.height ?? 0) / TWO;

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

  for (const viewport of [
    { ...phonePortraitViewport, width: NARROW_PHONE_WIDTH },
    phonePortraitViewport,
    { ...phonePortraitViewport, width: WIDE_PHONE_WIDTH },
    {
      ...phoneLandscapeViewport,
      height: phoneLandscapeViewport.height - REAL_CHROME_HEIGHT_PX,
    },
    TABLET_VIEWPORT,
    DESKTOP_VIEWPORT,
  ]) {
    const { width } = viewport;
    for (const rootFont of [DEFAULT_ROOT_FONT_PX, LARGE_ROOT_FONT_PX]) {
      test(`keeps card badge rows and point units together at ${width}px and ${rootFont}px root`, async ({
        page,
      }, testInfo) => {
        await applyViewportSize(page, viewport);
        await page.addStyleTag({
          content: `html { font-size: ${rootFont}px; }`,
        });
        const card = await openRetryMistakeQueue(page);
        await expect(
          card.getByRole("note", { name: /^Current-table comparison:/u }),
        ).toBeVisible();
        const measurements = await measureRetryCard(card, testInfo);
        const { cost, quantile, role } = measurements;
        expect.soft(role).not.toBeNull();
        expect
          .soft(Math.abs(centerY(quantile) - centerY(role)))
          .toBeLessThanOrEqual(1);
        if (width >= phoneLandscapeViewport.width) {
          expect
            .soft(Math.abs(centerY(cost) - centerY(role)))
            .toBeLessThanOrEqual(1);
        }
        for (const lines of [
          measurements.recordedLines,
          measurements.averageLines,
        ]) {
          expect
            .soft(Math.max(...lines) - Math.min(...lines))
            .toBeLessThanOrEqual(1);
        }
        expect.soft(measurements.overflow).toBe(0);
        expect.soft(measurements.pageOverflow).toBe(0);
        expect.soft(measurements.badgeWhiteSpace).toBe("nowrap");
        const row = measurements.badgeRow;
        expect.soft(cost?.x ?? Number.NaN).toBeGreaterThanOrEqual(row?.x ?? 0);
        expect
          .soft((cost?.x ?? 0) + (cost?.width ?? Number.NaN))
          .toBeLessThanOrEqual((row?.x ?? 0) + (row?.width ?? 0));
        expect
          .soft((row?.x ?? 0) + (row?.width ?? Number.NaN))
          .toBeLessThanOrEqual(width);
        expect
          .soft(measurements.pointsWhiteSpace)
          .toEqual(["nowrap", "nowrap"]);
      });
    }
  }

  const openMistakeQueueAtLargeFont = async (page: Page) => {
    await applyViewportSize(page, phonePortraitViewport);
    await page.getByRole("button", { name: "Mistake queue" }).click();
    await page.addStyleTag({ content: LARGE_ROOT_FONT });
  };

  test("mistake queue actions are visible without scrolling on a phone", async ({
    page,
  }) => {
    await applyViewportSize(page, phonePortraitViewport);
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
    await applyViewportSize(page, {
      height: shortHeight,
      width: phoneLandscapeViewport.width,
    });
    await page.getByRole("button", { name: "Mistake queue" }).click();

    const lossBadge = page.getByText(/Recorded cost:/u).first();
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
    await applyViewportSize(page, phoneLandscapeViewport);
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
