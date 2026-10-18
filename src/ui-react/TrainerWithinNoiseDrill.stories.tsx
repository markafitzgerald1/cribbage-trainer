/* jscpd:ignore-start */
import {
  createMockTally,
  createTestMistakeRecord,
  createTestPracticeRecord,
} from "../ui/mistakeQueue.test.common";
import { discardTallyKey, readTallyForDisplay } from "../ui/discardTally";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import { CribRole } from "../game/expectedCribPoints";
import type { Meta } from "./stories.common";
import { Trainer } from "./Trainer";
import { createGenerator } from "../game/randomNumberGenerator";
/* jscpd:ignore-end */

const meta = {
  args: {
    generateRandomNumber: createGenerator("1"),
    loadGoogleAnalytics: () => null,
    trackEvent: () => null,
  },
  component: Trainer,
  parameters: { layout: "fullscreen" },
  title: "Trainer/Within-noise drill retry",
} satisfies Meta<typeof Trainer>;

export default meta;

// Dealer hand whose best discard is within noise of QD 2S: loss about 0.06 against a threshold near 0.07.
const WITHIN_NOISE_HAND_KEY = "QD,9S,6S,6H,2S,AH|Dealer";
const LARGE_TEXT_ROOT_FONT_SIZE = "125%";
const WITHIN_NOISE_OUTCOME =
  "Within noise (approximate): counts as a successful retry. 1 of 2 toward mastery.";
// The verdict waits for the lazily loaded uncertainty sidecars, which findBy*'s one-second default cannot absorb under Docker.
const VERDICT_TIMEOUT = { timeout: 10_000 };
const BEHIND_BEST_CHOICE = /points behind the best choice/u;

const createWithinNoiseTally = (priorSuccesses: number) =>
  createMockTally({
    lifetime: {
      decisions: 1,
      expectedPointsLossTotal: 1.5,
      optimalDecisions: 0,
      skippedHands: 0,
    },
    practice:
      priorSuccesses === 0
        ? []
        : [
            createTestPracticeRecord({
              consecutiveSuccesses: priorSuccesses,
              handKey: WITHIN_NOISE_HAND_KEY,
            }),
          ],
    records: [
      createTestMistakeRecord({
        cribRole: CribRole.Dealer,
        discardKey: "6S,6H",
        expectedPointsLoss: 1.5,
        handKey: WITHIN_NOISE_HAND_KEY,
      }),
    ],
  });

const seedWithinNoiseTally = (priorSuccesses: number, rootFontSize = "") => {
  localStorage.setItem(
    discardTallyKey,
    JSON.stringify(createWithinNoiseTally(priorSuccesses)),
  );
  document.documentElement.style.fontSize = rootFontSize;
  return () => {
    localStorage.removeItem(discardTallyKey);
    document.documentElement.style.fontSize = "";
  };
};

// The drill relabels suits per view, so cards are picked by rank; the ranks used here are all distinct.
const checkboxForRank = (canvasElement: HTMLElement, rank: string) =>
  within(canvasElement)
    .getAllByRole("checkbox")
    .find((checkbox) =>
      checkbox.closest("label")?.textContent?.startsWith(rank),
    )!;

const startDrillAndRetry = async (
  canvasElement: HTMLElement,
  ranks: readonly string[],
) => {
  await fireEvent.click(
    within(canvasElement).getByRole("button", { name: "Mistake queue" }),
  );
  await fireEvent.click(
    within(canvasElement).getByRole("button", { name: "Practice this" }),
  );
  await Promise.all(
    ranks.map((rank) => fireEvent.click(checkboxForRank(canvasElement, rank))),
  );
  await fireEvent.click(
    within(canvasElement).getByRole("button", { name: "Check discard" }),
  );
  return within(canvasElement);
};

const expectRowFullyOnScreen = async (panel: HTMLElement, label: RegExp) => {
  const panelBox = panel.getBoundingClientRect();
  const row = within(panel).getByText(label).parentElement!;
  const box = row.getBoundingClientRect();

  await expect(box.top).toBeGreaterThanOrEqual(panelBox.top);
  await expect(box.bottom).toBeLessThanOrEqual(panelBox.bottom);
};

const expectStoredPractice = (
  expected: Partial<ReturnType<typeof readTallyForDisplay>["practice"][number]>,
) =>
  waitFor(async () => {
    await expect(readTallyForDisplay().practice[0]).toMatchObject(expected);
  });

export const WithinNoiseRetryCountsAsSuccess = {
  beforeEach: () => seedWithinNoiseTally(0, LARGE_TEXT_ROOT_FONT_SIZE),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = await startDrillAndRetry(canvasElement, ["Q", "2"]);
    const panel = canvas.getByLabelText("Practice drill");

    await expect(
      await canvas.findByText(WITHIN_NOISE_OUTCOME, {}, VERDICT_TIMEOUT),
    ).toBeVisible();
    await expect(canvas.queryByText(BEHIND_BEST_CHOICE)).toBeNull();
    await expect(panel.scrollTop).toBe(0);
    await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight);

    await expectRowFullyOnScreen(panel, /^Retry/u);
    await expectRowFullyOnScreen(panel, /^Then/u);
    await expectStoredPractice({
      attempts: 1,
      consecutiveSuccesses: 1,
      wrong: 0,
    });

    await expect(readTallyForDisplay().attemptLog?.at(-1)).toMatchObject({
      basis: "sampling-noise-v1",
      outcome: "success",
    });
  },
};

export const WorseRetryStillFailsAndResetsStreak = {
  beforeEach: () => seedWithinNoiseTally(1),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const worseRetry = await startDrillAndRetry(canvasElement, ["9", "A"]);
    const outcome = await worseRetry.findByText(
      BEHIND_BEST_CHOICE,
      {},
      VERDICT_TIMEOUT,
    );

    await expect(outcome).toBeVisible();
    await expect(worseRetry.queryByText(/Within noise/u)).toBeNull();

    await expectStoredPractice({
      attempts: 2,
      consecutiveSuccesses: 0,
      wrong: 1,
    });
  },
};
