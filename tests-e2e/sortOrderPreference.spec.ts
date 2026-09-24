import { expect, test } from "@playwright/test";
import { SORT_ORDER_KEY_PREFIX } from "../src/ui/sortOrderKeyPrefix";
import { constantHandQuery } from "./layoutMeasurements";

test("selected sort order persists across navigation and does not override deep link sort", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("radio", { name: "Descending" })).toBeChecked();

  await page.getByTitle("Ascending Sort").click();
  await expect(page.getByRole("radio", { name: "Ascending" })).toBeChecked();

  const storedValue = await page.evaluate((prefix) => {
    const key = Object.keys(localStorage).find((candidate) =>
      candidate.startsWith(prefix),
    );
    return key ? localStorage.getItem(key) : null;
  }, SORT_ORDER_KEY_PREFIX);
  expect(storedValue).toBe("ascending");

  await page.goto("/");
  await expect(page.getByRole("radio", { name: "Ascending" })).toBeChecked();

  await page.goto(`/${constantHandQuery}&sort=deal-order`);
  await expect(page.getByRole("radio", { name: "DealOrder" })).toBeChecked();
});
