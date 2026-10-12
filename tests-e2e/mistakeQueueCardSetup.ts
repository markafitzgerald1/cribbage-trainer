import type { Locator, Page, TestInfo } from "@playwright/test";
import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";
import { SEED_TALLY_WITH_QUANTILES } from "./practiceDrillSetup";
import type { TableIdentity } from "../src/game/tableIdentity";

const JSON_INDENT = 2;
const RECORDED_COST = 3.08;
const HIGH_LOSS_INDEX = 3;
const HIGH_LOSS = 5;
const DIGEST_SUFFIX_LENGTH = 52;

export const DIFFERENT_TABLE_IDENTITY: TableIdentity = {
  crib: { means_sha256: `4cd8a9258d32${"a".repeat(DIGEST_SUFFIX_LENGTH)}` },
  play: { means_sha256: `7420b1804f64${"b".repeat(DIGEST_SUFFIX_LENGTH)}` },
};

export const openRetryMistakeQueue = async (
  page: Page,
  tableIdentity: TableIdentity | null = null,
) => {
  await page.evaluate(
    ({ keyPrefix, tally, recordedCost, highLossIndex, highLoss, identity }) => {
      const replacements = new Map([
        [0, recordedCost],
        [highLossIndex, highLoss],
      ]);
      const records = tally.records.map((record, index) => ({
        ...record,
        expectedPointsLoss:
          replacements.get(index) ?? record.expectedPointsLoss,
        tableIdentity: identity,
      }));
      const practice = [
        {
          attempts: 2,
          consecutiveSuccesses: 0,
          handKey: "5H,6H,7H,8H,9H,10H|Dealer",
          lastAttemptAt: 1_700_000_000_002,
          totalWrongLoss: 6.46,
          wrong: 2,
        },
      ];
      window.localStorage.setItem(
        keyPrefix + new URL(document.baseURI).pathname,
        JSON.stringify({ ...tally, practice, records }),
      );
    },
    {
      highLoss: HIGH_LOSS,
      highLossIndex: HIGH_LOSS_INDEX,
      identity: tableIdentity,
      keyPrefix: DISCARD_TALLY_KEY_PREFIX,
      recordedCost: RECORDED_COST,
      tally: SEED_TALLY_WITH_QUANTILES,
    },
  );
  await page
    .getByRole("button", { exact: true, name: "Mistake queue" })
    .click();
  return page
    .getByRole("note", { name: "Average over 3 wrong attempts: 3.18 points" })
    .locator("../../..");
};

const measureTextLines = (note: Locator) =>
  note.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const lines: number[] = [];
    let node = walker.nextNode();
    while (node) {
      for (
        let offset = 0;
        offset < (node.textContent ?? "").length;
        offset += 1
      ) {
        const range = document.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        lines.push(range.getBoundingClientRect().top);
      }
      node = walker.nextNode();
    }
    return lines;
  });

export const measureRetryCard = async (card: Locator, testInfo: TestInfo) => {
  await card.screenshot({ path: testInfo.outputPath("card.png") });
  const recorded = card.getByRole("note", {
    name: "Recorded cost: 3.08 points",
  });
  const average = card.getByRole("note", {
    name: "Average over 3 wrong attempts: 3.18 points",
  });
  const role = await card.getByText("Dealer", { exact: true }).boundingBox();
  const quantile = await card
    .getByText("medium", { exact: true })
    .boundingBox();
  const cost = await recorded.boundingBox();
  const measurements = {
    averageLines: await measureTextLines(average.locator("span")),
    badgeRow: await recorded.locator("..").boundingBox(),
    badgeWhiteSpace: await recorded.evaluate(
      (element) => getComputedStyle(element).whiteSpace,
    ),
    card: await card.boundingBox(),
    cost,
    overflow: await card.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
    pageOverflow: await card
      .page()
      .evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    pointsWhiteSpace: await Promise.all(
      [recorded, average].map((note) =>
        note.evaluate((element) =>
          element.lastElementChild === null
            ? null
            : getComputedStyle(element.lastElementChild).whiteSpace,
        ),
      ),
    ),
    quantile,
    recordedLines: await measureTextLines(recorded),
    role,
    rootFont: await card.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize),
    ),
    viewport: card.page().viewportSize(),
  };
  await testInfo.attach("card-measurements", {
    body: JSON.stringify(measurements, null, JSON_INDENT),
    contentType: "application/json",
  });
  return measurements;
};
