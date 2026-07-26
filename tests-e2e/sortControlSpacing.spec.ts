import { type Page, expect, test } from "@playwright/test";
import {
  phoneLandscapeViewport,
  phonePortraitViewport,
  poneHandQuery,
  requireBoundingBox,
  rightEdge,
} from "./layoutMeasurements";

/*
 * A visually hidden radio that stays in flow still reserves a UA-sized box, and
 * every engine sizes that box differently: iOS Safari reserved roughly 20px per
 * radio where Chromium reserved 8px. That invisible width spread the sort
 * buttons apart, pushed Deal off the right edge of a phone screen, and widened
 * the side-by-side left column past the six cards, stranding empty space before
 * the analysis table. Desktop WebKit does not reproduce the phone box model, so
 * no headless rendering check can catch that directly. Asserting instead that
 * the row's spacing is exactly what this stylesheet declares turns the whole
 * class of divergence into a failure visible in every engine.
 */
const expectSpacingMatchesStylesheet = async (
  page: Page,
  viewport: { height: number; width: number },
) => {
  await page.setViewportSize(viewport);
  await page.goto(poneHandQuery);

  const sortControls = page.getByRole("group", { name: "Sort" });
  const declaredGap = Number.parseFloat(
    await sortControls.evaluate(
      (element) => globalThis.getComputedStyle(element).columnGap,
    ),
  );
  expect(declaredGap).toBeGreaterThan(0);

  const wrappers = await sortControls.locator("span").all();
  expect(wrappers.length).toBeGreaterThan(1);

  const measured = await Promise.all(
    wrappers.map(async (wrapper) => ({
      button: await requireBoundingBox(wrapper.locator("label")),
      wrapper: await requireBoundingBox(wrapper),
    })),
  );

  const renderedGaps = measured.reduce<{
    gaps: number[];
    previousRight: number | null;
  }>(
    (running, { wrapper }) => ({
      gaps:
        running.previousRight === null
          ? running.gaps
          : [...running.gaps, wrapper.x - running.previousRight],
      previousRight: rightEdge(wrapper),
    }),
    { gaps: [], previousRight: null },
  ).gaps;

  const subPixelTolerance = 0.1;

  // A wrapper wider than its button is exactly the radio's reserved box.
  for (const { button, wrapper } of measured) {
    expect(Math.abs(wrapper.width - button.width)).toBeLessThanOrEqual(
      subPixelTolerance,
    );
  }
  for (const renderedGap of renderedGaps) {
    expect(Math.abs(renderedGap - declaredGap)).toBeLessThanOrEqual(
      subPixelTolerance,
    );
  }
};

test("stacked-mode sort buttons are spaced only by the declared gap", async ({
  page,
}) => {
  await expectSpacingMatchesStylesheet(page, phonePortraitViewport);
});

test("side-by-side sort buttons are spaced only by the declared gap", async ({
  page,
}) => {
  await expectSpacingMatchesStylesheet(page, phoneLandscapeViewport);
});
