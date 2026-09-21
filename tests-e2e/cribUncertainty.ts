import { type Locator, type Page, expect } from "@playwright/test";

/*
 * The sidecar loads only after the ranked results paint, so anything that
 * reads or photographs the expanded row has to wait for it. Without this the
 * three expanded screenshot cases race a figure that appears a moment later,
 * and the resulting baseline depends on which side of that race the capture
 * landed on.
 */
export const cribAverageRow = (page: Page): Locator =>
  page.getByRole("button", { name: /Crib avg/u });

export const waitForCribUncertainty = async (page: Page) => {
  await expect(cribAverageRow(page).getByText(/^±/u)).toBeVisible();
};
