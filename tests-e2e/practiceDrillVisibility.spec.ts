import { expect, test } from "@playwright/test";
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
  { height: 844, name: "mobile 125% portrait", root: 20, width: 390 },
  { height: 340, name: "mobile 125% short landscape", root: 20, width: 844 },
];

for (const setting of settings) {
  test(`practice verdict stays visible at ${setting.name}`, async ({
    page,
  }, testInfo) => {
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
    await selectTwoDiscards(page);
    await page.getByRole("button", { name: "Check discard" }).click();
    await waitForAnalysis(page);
    const panel = page.getByRole("region", { name: "Practice drill" });
    const outcome = panel.getByText(
      /points behind the best choice with current tables/u,
    );
    await expect(outcome).toBeVisible();
    const measurements = await panel.evaluate((element) => {
      const verdict = element.querySelector("p[role='note']") as HTMLElement;
      const panelRect = element.getBoundingClientRect();
      const verdictRect = verdict.getBoundingClientRect();
      const rectangle = (bounds: DOMRect) => ({
        bottom: bounds.bottom,
        height: bounds.height,
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        width: bounds.width,
      });
      return {
        clientHeight: element.clientHeight,
        panel: rectangle(panelRect),
        rootFont: getComputedStyle(document.documentElement).fontSize,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
        verdict: rectangle(verdictRect),
        verdictInViewport:
          verdictRect.top >= 0 && verdictRect.bottom <= innerHeight,
        verdictInsidePanel:
          verdictRect.top >= panelRect.top &&
          verdictRect.bottom <= panelRect.bottom,
      };
    });
    await testInfo.attach("measurements", {
      body: JSON.stringify(measurements),
      contentType: "application/json",
    });
    await testInfo.attach("practice", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    expect(measurements.scrollTop).toBe(0);
    expect(measurements.verdictInViewport).toBe(true);
    expect(measurements.verdictInsidePanel).toBe(true);
    await expectPanelActionReachable(page, "Draw another");
    await expectPanelActionReachable(page, "Exit drill");
  });
}
