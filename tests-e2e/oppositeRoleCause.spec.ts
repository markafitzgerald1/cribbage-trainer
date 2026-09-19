import { expect, test } from "@playwright/test";
import { renderThenSelectTwoDiscards } from "./renderThenSelectTwoDiscards";

/*
 * Discarding the 9 of diamonds and the 3 of spades from this hand is exactly
 * equal-best as pone and gives up 3.11 points as dealer, so it is the #824
 * mistake in its pure form.
 */
const FIRST_DEALT_INDEX = 0;
const SIXTH_DEALT_INDEX = 5;
const FIFTH_DEALT_INDEX = 4;

const ROLE_FLIP_QUERY = "?hand=9D,9C,9H,4C,4H,3S&role=dealer&seed=e2e";
const ROLE_FLIP_DISCARD_INDICES: readonly [number, number] = [
  FIRST_DEALT_INDEX,
  SIXTH_DEALT_INDEX,
];

/*
 * Discarding the king of hearts and the 6 of spades here loses 3.46 as
 * dealer and 0.82 as pone: sub-optimal under both roles, so it is ordinary
 * crib misjudgment and must not be named as a role misread.
 */
const BOTH_ROLES_WRONG_QUERY = "?hand=KH,QS,10D,9C,6S,5H&role=dealer&seed=e2e";
const BOTH_ROLES_WRONG_DISCARD_INDICES: readonly [number, number] = [
  FIRST_DEALT_INDEX,
  FIFTH_DEALT_INDEX,
];

const SUB_OPTIMAL_TEXT = /Sub-optimal:/u;
const CAUSE_TEXT = "Optimal as pone";

test.describe("discarding for the reversed crib role", () => {
  test("names the cause beside the component decomposition", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, ROLE_FLIP_QUERY, {
      discardIndices: ROLE_FLIP_DISCARD_INDICES,
    });

    const caption = page.getByRole("status");

    await expect(caption).toContainText(SUB_OPTIMAL_TEXT);
    await expect(caption).toContainText("Crib");
    await expect(caption).toContainText(CAUSE_TEXT);
  });

  /*
   * The absence below means something only because the caption it would
   * appear in is already on screen and already calling this discard a
   * mistake, which the two assertions before it establish. Asserted on a
   * page that has rendered the cause nowhere would be satisfied by the
   * analysis simply not having loaded.
   */
  test("says nothing about role when the discard is wrong under both roles", async ({
    page,
  }) => {
    await renderThenSelectTwoDiscards(page, BOTH_ROLES_WRONG_QUERY, {
      discardIndices: BOTH_ROLES_WRONG_DISCARD_INDICES,
    });

    const caption = page.getByRole("status");

    await expect(caption).toBeVisible();
    await expect(caption).toContainText(SUB_OPTIMAL_TEXT);
    await expect(caption).not.toContainText(CAUSE_TEXT);
  });
});
