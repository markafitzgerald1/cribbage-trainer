import {
  LARGE_ROOT_FONT,
  SEED_TALLY,
  openSeededTrainer,
} from "./practiceDrillSetup";
import { type Locator, type Page, expect, test } from "@playwright/test";
import {
  applyViewportSize,
  phoneLandscapeViewport,
  phonePortraitViewport,
  requireBoundingBox,
} from "./layoutMeasurements";
import { originalIdentity } from "../src/ui-react/PracticeDrillPanel.test.common";
import { waitForAnalysis } from "./renderThenSelectTwoDiscards";

const FINGERPRINT_PREVIEW_LENGTH = 12;
const DEFAULT_FONT_SIZE = 16;
const ENLARGED_FONT_SIZE = 28;
const SHORT_LANDSCAPE_HEIGHT = 340;
const MASTERED_STREAK = 2;
const RECORDED_COST = 0.004;
const ORIGINAL_HAND = SEED_TALLY.records.at(
  0,
) as (typeof SEED_TALLY.records)[number];
const HAND_KEY = ORIGINAL_HAND.handKey;
const OLD_BEST_NOW = {
  ...SEED_TALLY,
  lifetime: {
    decisions: 1,
    expectedPointsLossTotal: RECORDED_COST,
    optimalDecisions: 0,
    skippedHands: 0,
  },
  practice: [
    {
      attempts: MASTERED_STREAK,
      consecutiveSuccesses: MASTERED_STREAK,
      handKey: HAND_KEY,
      lastAttemptAt: ORIGINAL_HAND.at + MASTERED_STREAK,
      recencyAt: ORIGINAL_HAND.at + MASTERED_STREAK,
      totalWrongLoss: 0,
      wrong: 0,
    },
  ],
  records: [
    {
      ...ORIGINAL_HAND,
      discardKey: "5H,10H",
      expectedPointsLoss: RECORDED_COST,
      recordedAdmission: { basis: "exact-fallback-v1", eligible: true },
      tableIdentity: originalIdentity,
    },
  ],
  version: 8,
};

const expectContained = async (page: Page, element: Locator) => {
  const box = await requireBoundingBox(element);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? Number.NaN,
  );
};

const openRecordedPoint = async (page: Page, pointer = false) => {
  await page
    .getByRole("button", { exact: true, name: "Quality trend" })
    .click();
  const marker = page.getByRole("button", {
    exact: true,
    name: "Decision #1, recorded cost less than 0.01 points, mastered in later retries. Select to see the hand.",
  });
  await marker.scrollIntoViewIfNeeded();
  await expect(marker).toBeVisible();
  if (pointer) await page.locator("rect[data-decision-ordinal='1']").click();
  else await marker.press("Enter");
  return page.getByRole("region", { exact: true, name: "Decision #1 detail" });
};

const checkCurrentBestRetry = async (page: Page) => {
  await expect(
    page.getByRole("region", { exact: true, name: "Practice drill" }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: /^Keep 5/u }).click();
  await page.getByRole("checkbox", { name: /^Keep 10/u }).click();
  await page
    .getByRole("button", { exact: true, name: "Check discard" })
    .click();
  await waitForAnalysis(page);
  await expect(
    page.getByRole("group", { name: /^Optimal discard/u }),
  ).toBeVisible();
  const drill = page.getByRole("region", {
    exact: true,
    name: "Practice drill",
  });
  await expect(drill).toContainText("Then — recorded cost");
  await expect(drill).toContainText("Retry — current tables");
  await expect(drill).toContainText(
    "Its recorded cost is from the original tables; this retry uses the current tables.",
  );
  await expect(
    drill.getByRole("note", {
      exact: true,
      name: "Then — recorded cost, less than 0.01 points",
    }),
  ).toHaveText("< 0.01");
  await page.getByRole("button", { exact: true, name: "Exit drill" }).click();
};

const expandAndPractice = async (page: Page, panel: Locator) => {
  const digest = panel.getByRole("note", {
    exact: true,
    name: `Play table fingerprint ${originalIdentity.play.means_sha256.slice(0, FINGERPRINT_PREVIEW_LENGTH)}`,
  });
  await digest.scrollIntoViewIfNeeded();
  await expect(digest).toBeInViewport();
  await expect(digest).toHaveText(
    `Play: ${originalIdentity.play.means_sha256.slice(0, FINGERPRINT_PREVIEW_LENGTH)}…`,
  );
  await expect(digest).toHaveAttribute(
    "title",
    originalIdentity.play.means_sha256,
  );
  await expectContained(page, digest);
  await panel
    .getByRole("button", { exact: true, name: "Practice this hand" })
    .click();
};

const rereadHistory = async (
  page: Page,
  viewport: typeof phonePortraitViewport,
  fontSize: number,
) => {
  // A fresh page has no fixture init script, so it reads the retry's actual persisted tally.
  const restored = await page.context().newPage();
  await applyViewportSize(restored, viewport);
  await restored.goto("/");
  if (fontSize === ENLARGED_FONT_SIZE)
    await restored.addStyleTag({ content: LARGE_ROOT_FONT });
  return restored;
};

for (const [mode, viewport] of [
  ["stacked", phonePortraitViewport],
  [
    "side-by-side",
    { ...phoneLandscapeViewport, height: SHORT_LANDSCAPE_HEIGHT },
  ],
] as const) {
  for (const fontSize of [DEFAULT_FONT_SIZE, ENLARGED_FONT_SIZE]) {
    test(`recorded history and practice stay reachable in ${mode} at ${fontSize}px root`, async ({
      page,
    }) => {
      await applyViewportSize(page, viewport);
      await openSeededTrainer(page, OLD_BEST_NOW);
      if (fontSize === ENLARGED_FONT_SIZE)
        await page.addStyleTag({ content: LARGE_ROOT_FONT });
      const tallyLoss = page.getByRole("note", {
        exact: true,
        name: "Recorded loss all time: less than 0.01 points per discard",
      });
      await expect(tallyLoss).toHaveText("< 0.01");
      await expectContained(page, tallyLoss);
      const panel = await openRecordedPoint(page);
      await expect(
        panel.getByRole("note", {
          exact: true,
          name: "Recorded cost for selected decision: less than 0.01 points",
        }),
      ).toHaveText("Recorded cost: < 0.01 points");
      await expect(panel).toContainText("Mastered in later retries");
      await panel
        .getByText("Judged with different tables", { exact: true })
        .click();
      await expandAndPractice(page, panel);
      await checkCurrentBestRetry(page);
      await expect(tallyLoss).toHaveText("< 0.01");
      const restored = await rereadHistory(page, viewport, fontSize);
      const after = await openRecordedPoint(restored, true);
      await expect(after).toContainText("Mastered in later retries");
      await expect(
        after.getByRole("button", { exact: true, name: "Practice this hand" }),
      ).toBeVisible();
      const table = restored.getByRole("table", {
        exact: true,
        name: "Recorded decision history",
      });
      await table.locator("tbody tr").first().scrollIntoViewIfNeeded();
      await expect(
        table.getByRole("note", {
          exact: true,
          name: "Recorded loss for Decisions 1–1: less than 0.01 points per discard",
        }),
      ).toHaveText("< 0.01");
    });
  }
}
