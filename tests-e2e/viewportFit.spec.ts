import { type Page, expect, test } from "@playwright/test";

/*
 * Measure the app root's rendered bottom, not `documentElement.scrollHeight`:
 * `body`'s `overflow-x: hidden` makes body the scroll container, so document
 * overflow never reaches the root and a scrollHeight assertion silently passes
 * however far the app overhangs.
 */
const appOverhangPx = async (
  page: Page,
  viewport: { height: number; width: number },
) => {
  await page.setViewportSize(viewport);
  await page.goto("/");

  return page.evaluate(() => {
    const app = document.getElementById("trainer");
    if (app === null) {
      throw new Error("App root is unavailable");
    }
    return Math.max(
      0,
      Math.round(app.getBoundingClientRect().bottom - window.innerHeight),
    );
  });
};

/*
 * Overhang is invisible on desktop but not on a phone: Chrome for Android
 * hides the overhanging strip behind its toolbar, and the consent controls are
 * the bottom-most row in both modes. Detecting overhang is negative-checked by
 * making the app root taller than the viewport; that the `svh` height prevents
 * it on a real phone is not, since small-viewport and percentage heights agree
 * without a toolbar.
 */
test("neither responsive mode renders the app past the viewport", async ({
  page,
}) => {
  const portraitOverhangPx = await appOverhangPx(page, {
    height: 844,
    width: 390,
  });
  const landscapeOverhangPx = await appOverhangPx(page, {
    height: 390,
    width: 844,
  });

  expect({
    landscape: landscapeOverhangPx,
    portrait: portraitOverhangPx,
  }).toEqual({ landscape: 0, portrait: 0 });
});
