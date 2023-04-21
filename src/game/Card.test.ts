import {
  CARD_INDICES,
  CARD_LABELS,
  MAXIMUM_CARD_COUNTING_VALUE,
  createCard,
} from "./Card";
import { describe, expect, it } from "@jest/globals";

describe.each(CARD_INDICES)("createCard %p", (rankValue) => {
  it(`rankValue is ${rankValue}`, () => {
    expect(createCard(rankValue).rankValue).toBe(rankValue);
  });

  const expectedRankLabel = CARD_LABELS[rankValue]!;

  it(`rankLabel is ${expectedRankLabel}`, () => {
    expect(createCard(rankValue).rankLabel).toBe(expectedRankLabel);
  });

  const expectedCount = Math.min(rankValue + 1, MAXIMUM_CARD_COUNTING_VALUE);

  it(`count is ${expectedCount}`, () => {
    expect(createCard(rankValue).count).toBe(expectedCount);
  });
});
