import { type Page, expect, test } from "@playwright/test";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";
import { waitForUncertainties } from "./uncertainty";

const LINES_CHUNK = /expectedPlayPointsLines-[\w-]+\.js$/u;
const PONE_HAND_QUERY = "?hand=KH,QS,10D,9C,6S,5H&role=pone&seed=e2e";
const LINES_TIMEOUT_MS = 20_000;

const openExpandedRow = async (page: Page) => {
  await renderThenSelectTwoDiscards(page, PONE_HAND_QUERY, true);
  await page.locator("tbody tr").first().click();
  await waitForUncertainties(page);
  return page.getByRole("button", { exact: true, name: "Opening plays" });
};

test("opening plays file is requested only once the line is opened", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (request) => {
    if (LINES_CHUNK.test(request.url())) {
      requested.push(request.url());
    }
  });
  const toggle = await openExpandedRow(page);

  // Every other deferred chunk has arrived by now, so an eager import would have been requested too.
  expect(requested).toStrictEqual([]);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.click();

  await expect(
    page.getByText(/^You lead \S+ in \d+% of hands$/u).first(),
  ).toBeAttached({
    timeout: LINES_TIMEOUT_MS,
  });
  expect(requested).toHaveLength(1);
});

test("opening plays say unavailable when the file cannot load", async ({
  page,
}) => {
  await page.route(LINES_CHUNK, async (route) => {
    await route.abort();
  });
  const toggle = await openExpandedRow(page);

  await toggle.click();

  await expect(page.getByText("Opening plays unavailable")).toBeVisible({
    timeout: LINES_TIMEOUT_MS,
  });
  await expect(page.getByText(/% of hands/u)).toHaveCount(0);
});
