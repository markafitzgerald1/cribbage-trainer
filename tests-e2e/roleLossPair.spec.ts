import { expect, test } from "@playwright/test";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";

const FIRST_DEALT_INDEX = 0;
const FIFTH_DEALT_INDEX = 4;
const SIXTH_DEALT_INDEX = 5;

/*
 * Discarding the 9 of diamonds and the 3 of spades from this hand costs
 * 3.11 as dealer and exactly nothing as pone, which is the widest split
 * between the two roles any fixture here needs.
 */
const ROLE_SPLIT_QUERY = "?hand=9D,9C,9H,4C,4H,3S&role=dealer&seed=e2e";
const ROLE_SPLIT_DISCARD_INDICES: readonly [number, number] = [
  FIRST_DEALT_INDEX,
  SIXTH_DEALT_INDEX,
];

/*
 * Discarding the king of hearts and the 6 of spades here costs 3.46 as
 * dealer and 0.82 as pone: both figures positive, so the caption states two
 * costs without either of them reading as a verdict.
 */
const BOTH_ROLES_COSTLY_QUERY = "?hand=KH,QS,10D,9C,6S,5H&role=dealer&seed=e2e";
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

    const caption = page.getByRole("status");

    await expect(caption).toContainText("3.11 as dealer, 0.00 as pone");
    // The component decomposition is still there: the pair is evidence beside it, not a replacement for it.
    await expect(caption).toContainText("Crib");

    /*
     * The reversed-role figure is the one thing on this caption a reader can
     * act on, so it is marked in two ways rather than one: dropping either
     * fails here. Color alone would leave the pair reading as flatly as any
     * other two numbers, which is what this treatment exists to fix.
     */
    const freeRoleCost = caption.getByText("0.00 as pone");

    await expect(freeRoleCost).toHaveCSS("text-decoration-line", "underline");
    await expect(freeRoleCost).toHaveCSS("color", "rgb(126, 230, 138)");
  });

  test("states two positive costs when the discard is wrong under both roles", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, BOTH_ROLES_COSTLY_QUERY, {
      discardIndices: BOTH_ROLES_COSTLY_DISCARD_INDICES,
    });

    const caption = page.getByRole("status");

    await expect(caption).toContainText("3.46 as dealer, 0.82 as pone");
    // Nothing here is free, so nothing is marked; the mark has to mean this hand rather than this badge.
    await expect(caption.getByText("0.82 as pone")).toHaveCSS(
      "text-decoration-line",
      "none",
    );
  });
});
