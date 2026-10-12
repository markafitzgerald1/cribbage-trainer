import { expect, test } from "@playwright/test";
import {
  phonePortraitViewport,
  requireBoundingBox,
} from "./layoutMeasurements";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";

const FIRST_DEALT_INDEX = 0;
const THIRD_DEALT_INDEX = 2;
const FIFTH_DEALT_INDEX = 4;
const SIXTH_DEALT_INDEX = 5;

/*
 * Discarding the 9 of diamonds and the 3 of spades from this hand costs
 * 3.37 as dealer and exactly nothing as pone, which is the widest split
 * between the two roles any fixture here needs.
 */
const ROLE_SPLIT_QUERY = "?hand=9D,9C,9H,4C,4H,3S&role=dealer&seed=e2e";
const ROLE_SPLIT_DISCARD_INDICES: readonly [number, number] = [
  FIRST_DEALT_INDEX,
  SIXTH_DEALT_INDEX,
];

/*
 * Discarding the king of hearts and the 6 of spades here costs 3.38 as
 * dealer and 1.03 as pone. Held as dealer the reversed role is the cheaper
 * one, so both figures are stated and neither reads as a verdict; held as
 * pone the same discard is the one the reader already got more nearly
 * right, and the reversed figure is withheld.
 */
const BOTH_ROLES_COSTLY_HAND = "?hand=KH,QS,10D,9C,6S,5H";
const BOTH_ROLES_COSTLY_QUERY = `${BOTH_ROLES_COSTLY_HAND}&role=dealer&seed=e2e`;
const CHEAPER_ROLE_HELD_QUERY = `${BOTH_ROLES_COSTLY_HAND}&role=pone&seed=e2e`;
const BOTH_ROLES_COSTLY_DISCARD_INDICES: readonly [number, number] = [
  FIRST_DEALT_INDEX,
  FIFTH_DEALT_INDEX,
];

test.describe("both crib-role costs for the chosen discard", () => {
  test("states the pair rather than naming a cause when one role costs nothing", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, ROLE_SPLIT_QUERY, {
      discardIndices: ROLE_SPLIT_DISCARD_INDICES,
    });

    const caption = page.locator("figcaption[aria-label]");
    const liveRegion = page.getByRole("status");

    await expect(liveRegion).toContainText(
      "3.37 points lost as dealer, 0.00 as pone",
    );
    await expect(caption).toContainText("3.37 dealer, 0.00 pone");
    // The component decomposition is still there: the pair is evidence beside it, not a replacement for it.
    await expect(caption).toContainText("Crib");

    /*
     * The underline is the whole mark, so its thickness is asserted as well
     * as its presence: the browser default is thinner than this and would
     * satisfy a bare "underline" while reading as an artifact of the font.
     * The color assertion is the other half of the same rule — the figure
     * has to inherit the badge's, because a color here made the secondary
     * number the loudest thing on the screen.
     */
    const freeRoleCost = caption.getByText("0.00 pone");
    // ".." selects the parent, which is the badge: the element declaring the color this figure must still inherit.
    const badgeColor = await freeRoleCost
      .locator("..")
      .evaluate((element) => window.getComputedStyle(element).color);

    await expect(freeRoleCost).toHaveCSS("text-decoration-line", "underline");
    await expect(freeRoleCost).toHaveCSS("text-decoration-thickness", "2px");
    await expect(freeRoleCost).toHaveCSS("color", badgeColor);
  });

  test("states two positive costs when the reversed role would have cost less", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, BOTH_ROLES_COSTLY_QUERY, {
      discardIndices: BOTH_ROLES_COSTLY_DISCARD_INDICES,
    });

    const caption = page.locator("figcaption[aria-label]");
    const liveRegion = page.getByRole("status");

    await expect(liveRegion).toContainText(
      "3.38 points lost as dealer, 1.03 as pone",
    );
    await expect(caption).toContainText("3.38 dealer, 1.03 pone");
    // Nothing here is free, so nothing is marked; the mark has to mean this hand rather than this badge.
    await expect(caption.getByText("1.03 pone")).toHaveCSS(
      "text-decoration-line",
      "none",
    );
  });

  /*
   * The same cards and the same discard as the test above, held as the role
   * they suited better. A reversed cost that is higher says only that the
   * other role would have been worse, so the caption drops to the single
   * figure it carried before #824 — which is the state most hands are in.
   */
  test("states one cost when the reversed role would have cost more", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, CHEAPER_ROLE_HELD_QUERY, {
      discardIndices: BOTH_ROLES_COSTLY_DISCARD_INDICES,
    });

    const caption = page.locator("figcaption[aria-label]");
    const liveRegion = page.getByRole("status");

    // The caption is on screen with its single figure before anything is asserted absent, so the pair is withheld rather than simply not yet on screen.
    await expect(caption).toContainText("Sub-optimal: 1.03 pts lost");
    await expect(caption).not.toContainText("dealer");
    await expect(liveRegion).toContainText("Sub-optimal: 1.03 points lost");
  });
});

/*
 * Discarding the 4 of hearts and the king of hearts from this hand as dealer
 * costs 0.04, which is within simulation noise, so the caption carries a
 * verdict badge and a reason badge: the pair whose row count must not depend
 * on the viewport width.
 */
const CAPTION_ROW_HAND_QUERY = "?hand=4H,5D,KH,6H,8C,KC&role=dealer&seed=e2e";
const CAPTION_ROW_DISCARD_INDICES: readonly [number, number] = [
  FIRST_DEALT_INDEX,
  THIRD_DEALT_INDEX,
];
const DEFERRED_SIDECAR_TIMEOUT_MS = 20_000;
const desktopViewport = { height: 800, width: 1280 };

const captionRowSizes = [
  { name: "desktop width", viewport: desktopViewport },
  { name: "phone portrait", viewport: phonePortraitViewport },
] as const;

test.describe("diagnostic caption rows", () => {
  for (const { name, viewport } of captionRowSizes) {
    // Desktop engines model neither the phone's toolbar nor its real font scaling, so this guards layout logic only.
    test(`keeps the verdict on one line with the reason on its own row at ${name}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await renderThenSelectTwoDiscards(page, CAPTION_ROW_HAND_QUERY, {
        discardIndices: CAPTION_ROW_DISCARD_INDICES,
      });

      const badges = page
        .locator("figcaption[aria-label]")
        .locator(":scope > span");
      const verdict = badges.nth(0);
      const reason = badges.nth(1);
      // The verdict waits on two deferred sidecar chunks, so it gets the explicit timeout those loads need on a cold worker.
      await expect(verdict).toContainText("Within noise", {
        timeout: DEFERRED_SIDECAR_TIMEOUT_MS,
      });
      await expect(reason).toContainText("Crib");

      /*
       * A one-character twin of the verdict badge, styled identically, is one
       * text line tall whatever `line-height: normal` resolves to, so the
       * expectation comes from the badge itself rather than a pixel count.
       */
      const singleLineHeight = await verdict.evaluate((element) => {
        const probe = element.cloneNode(false) as HTMLElement;
        probe.textContent = "X";
        element.after(probe);
        const { height } = probe.getBoundingClientRect();
        probe.remove();
        return height;
      });
      const verdictBox = await requireBoundingBox(verdict);
      const reasonBox = await requireBoundingBox(reason);

      expect(verdictBox.height).toBeCloseTo(singleLineHeight, 0);
      expect(reasonBox.y).toBeGreaterThanOrEqual(
        verdictBox.y + verdictBox.height,
      );
    });
  }
});
