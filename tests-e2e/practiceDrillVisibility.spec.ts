import { type Locator, type Page, expect, test } from "@playwright/test";
import {
  expectPanelActionReachable,
  openEarlierTableTrainer,
  selectTwoDiscards,
  startDrillOnFirstMistake,
} from "./practiceDrillSetup";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

const settings = [
  { height: 1000, name: "desktop XLarge portrait", root: 24, width: 800 },
  { height: 800, name: "desktop XLarge landscape", root: 24, width: 1280 },
  {
    height: 600,
    name: "desktop XLarge short landscape",
    root: 24,
    width: 1280,
  },
  { height: 844, name: "mobile 125% portrait", root: 20, width: 390 },
  { height: 915, name: "Pixel 125% portrait", root: 20, width: 412 },
  { height: 340, name: "mobile 125% short landscape", root: 20, width: 844 },
];

const PIXEL_WIDTH = 412;
const PIXEL_TABLE_BASELINES = new Map([
  [
    "chromium",
    { missHeight: 214, missRows: 4, successHeight: 244, successRows: 4 },
  ],
  [
    "firefox",
    { missHeight: 192, missRows: 2, successHeight: 225, successRows: 4 },
  ],
  [
    "webkit",
    { missHeight: 188, missRows: 3, successHeight: 222, successRows: 4 },
  ],
]);
const SIDE_BY_SIDE_RATIO = 1.2;
const SHORT_LANDSCAPE_HEIGHT = 600;
const ABOVE_COMPARISON_COUNT = 2;
const COMPARISON_COUNT = 2;

const measurePractice = (panel: Locator) =>
  panel.evaluate((element) => {
    const panelRect = element.getBoundingClientRect();
    const rectangle = (target: Element) => {
      const bounds = target.getBoundingClientRect();
      return {
        bottom: bounds.bottom,
        height: bounds.height,
        inViewport:
          bounds.top >= 0 &&
          bounds.bottom <= innerHeight &&
          bounds.left >= 0 &&
          bounds.right <= innerWidth,
        insidePanel:
          bounds.top >= panelRect.top &&
          bounds.bottom <= panelRect.bottom &&
          bounds.left >= panelRect.left &&
          bounds.right <= panelRect.right,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
      };
    };
    const verdict = element.lastElementChild as HTMLElement;
    const contents = [...verdict.children].map((child) => ({
      ...rectangle(child),
      children: [...child.querySelectorAll(":scope > *, :scope > div > *")].map(
        rectangle,
      ),
      text: child.textContent,
    }));
    const table = document.querySelector("table") as HTMLElement;
    const container = table.parentElement as HTMLElement;
    const tableBounds = container.getBoundingClientRect();
    const header = table.querySelector("thead") as HTMLElement;
    const headerBottom = header.getBoundingClientRect().bottom;
    const rows = [...table.querySelectorAll("tbody tr")].map((row) =>
      row.getBoundingClientRect(),
    );
    const figure = table.closest("figure") as HTMLElement;
    const tally = figure.nextElementSibling as HTMLElement;
    return {
      backgroundAttachment: getComputedStyle(element).backgroundAttachment,
      clientHeight: element.clientHeight,
      contents,
      deviceScaleFactor: devicePixelRatio,
      figure: rectangle(figure),
      footer: rectangle(tally),
      footerGap:
        tally.getBoundingClientRect().top -
        figure.getBoundingClientRect().bottom,
      footerMargin: getComputedStyle(tally).marginTop,
      gridGap: getComputedStyle(tally.parentElement as Element).rowGap,
      overflowY: getComputedStyle(element).overflowY,
      panel: rectangle(element),
      rootFont: getComputedStyle(document.documentElement).fontSize,
      scrollHeight: element.scrollHeight,
      scrollTop: element.scrollTop,
      table: {
        clientHeight: container.clientHeight,
        fullyVisibleRows: rows.filter(
          (row) =>
            row.top >= Math.max(tableBounds.top, headerBottom) &&
            row.bottom <= Math.min(tableBounds.bottom, innerHeight),
        ).length,
      },
    };
  });

const expectPracticeContents = async (
  panel: Locator,
  measurements: Awaited<ReturnType<typeof measurePractice>>,
  shortLandscape: boolean,
) => {
  expect(measurements.scrollTop).toBe(0);
  expect(measurements.panel.inViewport).toBe(true);
  for (const [index, content] of measurements.contents.entries()) {
    if (!shortLandscape || index < ABOVE_COMPARISON_COUNT) {
      expect.soft(content.insidePanel, content.text ?? "actions").toBe(true);
      expect.soft(content.inViewport, content.text ?? "actions").toBe(true);
      for (const child of content.children) {
        expect.soft(child.insidePanel).toBe(true);
        expect.soft(child.inViewport).toBe(true);
      }
    }
  }
  if (shortLandscape) {
    expect(measurements.overflowY).toBe("auto");
    expect(measurements.backgroundAttachment).toContain("local");
    expect(measurements.backgroundAttachment).toContain("scroll");
    await panel.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(
      panel.getByText(/Tables changed since this decision/u),
    ).toBeInViewport({ ratio: 1 });
    await panel.evaluate((element) => {
      element.scrollTop = 0;
    });
  } else {
    expect(measurements.scrollHeight).toBeLessThanOrEqual(
      measurements.clientHeight,
    );
  }
};

const expectComparisonLines = (
  measurements: Awaited<ReturnType<typeof measurePractice>>,
) => {
  const rows = measurements.contents.slice(
    ABOVE_COMPARISON_COUNT,
    ABOVE_COMPARISON_COUNT + COMPARISON_COUNT,
  );
  for (const row of rows) {
    expect(Math.max(...row.children.map((child) => child.top))).toBeLessThan(
      Math.min(...row.children.map((child) => child.bottom)),
    );
  }
};

const revealPractice = async (
  page: Page,
  setting: (typeof settings)[number],
  successful: boolean,
) => {
  await openEarlierTableTrainer(page);
  await startDrillOnFirstMistake(page);
  await page.setViewportSize({
    height: setting.height,
    width: setting.width,
  });
  await page.addStyleTag({
    content: `html { font-size: ${setting.root}px; }`,
  });
  await expectPanelActionReachable(page, "Check discard");
  await expectPanelActionReachable(page, "Exit drill");
  if (successful) {
    await page.getByRole("checkbox", { name: /^Keep 10/u }).click();
    await page.getByRole("checkbox", { name: /^Keep 5/u }).click();
  } else {
    await selectTwoDiscards(page);
  }
  await page.getByRole("button", { name: "Check discard" }).click();
  await waitForAnalysis(page);
  await expect(
    page.locator("figcaption").filter({
      hasText: successful ? /^Optimal/u : /^Sub-optimal/u,
    }),
  ).toBeVisible();
};

for (const setting of settings) {
  test.describe(setting.name, () => {
    if (setting.width === PIXEL_WIDTH) test.use({ deviceScaleFactor: 2.625 });

    for (const successful of [false, true]) {
      test(`revealed ${successful ? "successful retry" : "miss"} stays visible where space permits`, async ({
        browserName,
        page,
      }, testInfo) => {
        await revealPractice(page, setting, successful);
        const panel = page.getByRole("region", { name: "Practice drill" });
        await expect(
          panel.getByText(
            successful
              ? /successful retries toward mastery/u
              : /points behind the best choice/u,
          ),
        ).toBeVisible();
        const measurements = await measurePractice(panel);
        await testInfo.attach("measurements", {
          body: JSON.stringify(measurements),
          contentType: "application/json",
        });
        await testInfo.attach("practice", {
          body: await page.screenshot(),
          contentType: "image/png",
        });
        await expectPracticeContents(
          panel,
          measurements,
          setting.width / setting.height >= SIDE_BY_SIDE_RATIO &&
            setting.height <= SHORT_LANDSCAPE_HEIGHT,
        );
        if (setting.width >= PIXEL_WIDTH) expectComparisonLines(measurements);
        if (setting.width === PIXEL_WIDTH) {
          // Font metrics differ by engine; retain each measured capped-panel budget.
          const baseline = PIXEL_TABLE_BASELINES.get(browserName);
          if (!baseline) throw new Error("Missing table-height baseline");
          expect(measurements.table.clientHeight).toBeGreaterThanOrEqual(
            successful ? baseline.successHeight : baseline.missHeight,
          );
          expect(measurements.table.fullyVisibleRows).toBeGreaterThanOrEqual(
            successful ? baseline.successRows : baseline.missRows,
          );
        }
        await expectPanelActionReachable(page, "Draw another");
        await expectPanelActionReachable(page, "Exit drill");
      });
    }
  });
}
