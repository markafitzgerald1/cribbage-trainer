import {
  DIFFERENT_TABLE_IDENTITY,
  openRetryMistakeQueue,
} from "./mistakeQueueCardSetup";
import { LARGE_ROOT_FONT, openSeededTrainer } from "./practiceDrillSetup";
import { expect, test } from "@playwright/test";
import {
  phoneLandscapeViewport,
  phonePortraitViewport,
} from "./layoutMeasurements";
import cribSidecar from "../src/game/expectedCribPointsUncertainty.json";
import playSidecar from "../src/game/expectedPlayPointsUncertainty.json";

const PREVIEW_LENGTH = 12;
const BROWSER_BARS_HEIGHT = 50;
const CURRENT_TABLE_IDENTITY = {
  crib: { means_sha256: cribSidecar.means_sha256 },
  play: { means_sha256: playSidecar.means_sha256 },
};

for (const { identity, summary } of [
  {
    identity: CURRENT_TABLE_IDENTITY,
    summary: "Judged with current tables",
  },
  {
    identity: DIFFERENT_TABLE_IDENTITY,
    summary: "Judged with different tables",
  },
]) {
  for (const viewport of [
    phonePortraitViewport,
    {
      height: phoneLandscapeViewport.height - BROWSER_BARS_HEIGHT,
      width: phoneLandscapeViewport.width,
    },
  ]) {
    test(`shows shortened fingerprints for ${summary} at ${viewport.width}px with a large root`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openSeededTrainer(page);
      await page.addStyleTag({ content: LARGE_ROOT_FONT });
      const card = await openRetryMistakeQueue(page, identity);
      const details = card.locator("details");
      await expect(card.getByText(summary, { exact: true })).toBeVisible();
      await expect(details).not.toHaveAttribute("open");
      await card.getByText(summary, { exact: true }).click();
      await expect(details).toHaveAttribute("open", "");
      await expect(
        card.getByText("Table fingerprints (for bug reports)"),
      ).toBeVisible();
      await Promise.all(
        [
          { digest: identity.crib.means_sha256, role: "Crib" },
          { digest: identity.play.means_sha256, role: "Play" },
        ].map(async ({ role, digest }) => {
          const preview = digest.slice(0, PREVIEW_LENGTH);
          const name = `${role} table fingerprint ${preview}`;
          const fingerprint = card.getByRole("note", { exact: true, name });
          await expect(fingerprint).toBeVisible();
          await expect(fingerprint).toHaveText(`${role}: ${preview}…`);
          await expect(fingerprint).toHaveAttribute("title", digest);
          await expect(fingerprint).toHaveAccessibleName(name);
        }),
      );
      expect(
        await card.evaluate(
          (element) => element.scrollWidth - element.clientWidth,
        ),
      ).toBe(0);
    });
  }
}
