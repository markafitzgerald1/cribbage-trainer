import type { Locator, Page } from "@playwright/test";

export const poneHandQuery = "/?hand=KH,QS,10D,9C,6S,5H&role=pone";

export const constantHandQuery = "?hand=KH,QS,10D,9C,6S,5H&seed=e2e";

// A shared literal, so a locator cannot go substring-matching by accident.
export const exactTextMatch = { exact: true };

export const phonePortraitViewport = { height: 844, width: 390 };

export const phoneLandscapeViewport = { height: 390, width: 844 };

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
