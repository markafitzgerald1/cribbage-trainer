import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";
import type { Page } from "@playwright/test";
import { SEED_TALLY_WITH_QUANTILES } from "./practiceDrillSetup";

const RECORDED_COST = 3.08;
const HIGH_LOSS_INDEX = 3;
const HIGH_LOSS = 5;

export const openRetryMistakeQueue = async (page: Page) => {
  await page.evaluate(
    ({ keyPrefix, tally, recordedCost, highLossIndex, highLoss }) => {
      const replacements = new Map([
        [0, recordedCost],
        [highLossIndex, highLoss],
      ]);
      const records = tally.records.map((record, index) => ({
        ...record,
        expectedPointsLoss:
          replacements.get(index) ?? record.expectedPointsLoss,
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
