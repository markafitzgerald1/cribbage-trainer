import type { Locator, Page } from "@playwright/test";

export const poneHandQuery = "/?hand=KH,QS,10D,9C,6S,5H&role=pone";

export const constantHandQuery = "?hand=KH,QS,10D,9C,6S,5H&seed=e2e";

// A shared literal, so a locator cannot go substring-matching by accident.
export const exactTextMatch = { exact: true };

export const phonePortraitViewport = { height: 844, width: 390 };

export const phoneLandscapeViewport = { height: 390, width: 844 };

/*
 * Playwright 1.64's mobile WebKit leaves the layout viewport at its old height
 * when the first `setViewportSize` call after a load grows it well past the
 * preset height (664 to 844; one pixel lands): `innerHeight` follows,
 * `documentElement.clientHeight` and `100%` heights do not. Every later call
 * lands correctly, and a first call that leaves the size unchanged still
 * counts as the first, so requesting one pixel short of the target first
 * keeps the target off that first call whatever the current size.
 */
export const applyViewportSize = async (
  page: Page,
  size: { height: number; width: number },
) => {
  await page.setViewportSize({ ...size, height: size.height - 1 });
  await page.setViewportSize(size);
};

export const requireBoundingBox = async (locator: Locator) => {
  const bounds = await locator.boundingBox();
  if (bounds === null) {
    throw new Error("Bounding box is unavailable");
  }
  return bounds;
};

export const requireDealButtonBounds = (page: Page) =>
  requireBoundingBox(page.getByRole("button", { name: /^Deal$/u }));

export const rightEdge = (bounds: { width: number; x: number }) =>
  bounds.x + bounds.width;
