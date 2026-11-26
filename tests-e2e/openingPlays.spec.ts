import { type Page, expect, test } from "@playwright/test";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";
import { waitForUncertainties } from "./uncertainty";

const LINES_FILE = /expectedPlayPointsLines-[\w-]+\.json$/u;
const LINES_FILE_PREFIX = "/expectedPlayPointsLines-";
const OPENED_AT_ATTRIBUTE = "data-opened-at";
const PONE_HAND_QUERY = "?hand=KH,QS,10D,9C,6S,5H&role=pone&seed=e2e";
const LINES_TIMEOUT_MS = 20_000;
const UNAVAILABLE = "Opening plays unavailable";
const SPOKEN_LEAD = /^You lead \S+ in \d+% of hands$/u;

const openExpandedRow = async (page: Page) => {
  await renderThenSelectTwoDiscards(page, PONE_HAND_QUERY, true);
  await page.locator("tbody tr").first().click();
  await waitForUncertainties(page);
  return page.getByRole("button", { exact: true, name: "Opening plays" });
};

/*
 * Times the file's request against the toggle's own click, read from the
 * page's resource timing. Hovering and focusing first gives a load started on
 * either a chance to begin before the click, which this then catches.
 */
test("opening plays file is requested only once the line is opened", async ({
  page,
}) => {
  const toggle = await openExpandedRow(page);
  await toggle.evaluate((element, attribute) => {
    element.addEventListener(
      "click",
      () => {
        element.setAttribute(attribute, String(performance.now()));
      },
      { capture: true, once: true },
    );
  }, OPENED_AT_ATTRIBUTE);

  await toggle.hover();
  await toggle.focus();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();

  await expect(page.getByText(SPOKEN_LEAD).first()).toBeAttached({
    timeout: LINES_TIMEOUT_MS,
  });
  const startsAfterOpening = await toggle.evaluate(
    (element, [prefix, attribute]) =>
      performance
        .getEntriesByType("resource")
        .filter(({ name }) => name.includes(prefix))
        .map(
          ({ startTime }) =>
            startTime >= Number(element.getAttribute(attribute)),
        ),
    [LINES_FILE_PREFIX, OPENED_AT_ATTRIBUTE] as const,
  );
  expect(startsAfterOpening).toStrictEqual([true]);
});

test("opening plays recover on reopening after the file failed to load", async ({
  page,
}) => {
  let refusals = 0;
  await page.route(LINES_FILE, async (route) => {
    if (refusals === 0) {
      refusals += 1;
      await route.abort();
      return;
    }
    await route.continue();
  });
  const toggle = await openExpandedRow(page);

  await toggle.click();

  await expect(page.getByText(UNAVAILABLE)).toBeVisible({
    timeout: LINES_TIMEOUT_MS,
  });
  await expect(page.getByText(/% of hands/u)).toHaveCount(0);

  await toggle.click();
  await toggle.click();

  await expect(page.getByText(SPOKEN_LEAD).first()).toBeAttached({
    timeout: LINES_TIMEOUT_MS,
  });
  await expect(page.getByText(UNAVAILABLE)).toHaveCount(0);
});
