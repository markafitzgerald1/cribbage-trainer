import { CARDS_PER_DEALT_HAND, CARDS_PER_KEPT_HAND } from "./facts";
import { describe, expect, it } from "@jest/globals";
import { createCard } from "./Card";
import { discardIsComplete } from "./discardIsComplete";

describe("discardIsComplete", () => {
  it.each([
    [
      `is false when more than ${CARDS_PER_KEPT_HAND} cards are kept`,
      CARDS_PER_KEPT_HAND + 1,
      false,
    ],
    [
      `is true when ${CARDS_PER_KEPT_HAND} cards are kept`,
      CARDS_PER_KEPT_HAND,
      true,
    ],
    [
      `is false when less than ${CARDS_PER_KEPT_HAND} cards are kept`,
      CARDS_PER_KEPT_HAND - 1,
      false,
    ],
  ])("%s", (_, keptCount, expected) => {
    const hand = [...Array(CARDS_PER_DEALT_HAND).keys()].map(
      (rank, dealOrder) => ({
        ...createCard(rank),
        dealOrder,
        kept: dealOrder < keptCount,
      }),
    );

    expect(discardIsComplete(hand)).toBe(expected);
  });
});
