import {
  CARD_LABELS,
  CARD_RANKS,
  MAXIMUM_CARD_COUNTING_VALUE,
  createCard,
} from "./Card";
import { describe, expect, it } from "@jest/globals";

describe.each(CARD_RANKS)("createCard %p", (rank) => {
  it(`rank is ${rank}`, () => {
    expect(createCard(rank).rank).toBe(rank);
  });

  const expectedRankLabel = CARD_LABELS[rank]!;

  it(`rankLabel is ${expectedRankLabel}`, () => {
    expect(createCard(rank).rankLabel).toBe(expectedRankLabel);
  });

  const expectedCount = Math.min(rank + 1, MAXIMUM_CARD_COUNTING_VALUE);

  it(`count is ${expectedCount}`, () => {
    expect(createCard(rank).count).toBe(expectedCount);
  });
});
