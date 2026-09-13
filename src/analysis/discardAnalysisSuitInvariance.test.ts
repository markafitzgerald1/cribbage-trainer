import { type Card, Suit, parseHand } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import type { ScoredKeepDiscard } from "./analysis";
import { permuteCardSuits } from "../game/suitPermutation";
import { scoreDeal } from "./analysis.test.common";

/*
 * Cribbage has no trump: suits affect scoring only through flushes and his
 * nobs, both preserved under a GLOBAL relabeling of suits (AGENTS.md's
 * Project overview). This is the proof #767 requires rather than assumes —
 * every real analysis field the trainer displays, recomputed for a
 * suit-permuted deal, must match the original exactly, and the discard the
 * model prefers must be the same rank pair either way.
 */
const ROTATE_SUITS: readonly Suit[] = [
  Suit.DIAMONDS,
  Suit.HEARTS,
  Suit.SPADES,
  Suit.CLUBS,
];

interface ComparableFields {
  readonly expectedHandPoints: number;
  readonly expectedNetPoints: number;
  readonly expectedPlayPointsDelta: number;
  readonly handPoints: number;
  readonly signedExpectedCribPoints: number;
}

const toComparable = (
  scoredKeepDiscard: ScoredKeepDiscard<Card>,
): ComparableFields => ({
  expectedHandPoints: scoredKeepDiscard.expectedHandPoints,
  expectedNetPoints: scoredKeepDiscard.expectedNetPoints,
  expectedPlayPointsDelta: scoredKeepDiscard.expectedPlayPoints.delta,
  handPoints: scoredKeepDiscard.handPoints,
  signedExpectedCribPoints: scoredKeepDiscard.signedExpectedCribPoints,
});

// The two discarded ranks, sorted — unique per candidate because every test hand below deals six distinct ranks, and suit-independent so it identifies the same decision across a relabeling.
const discardRankKey = (cards: readonly Card[]): string =>
  [...cards]
    .map((card) => card.rank)
    .sort((first, second) => first - second)
    .join(",");

const comparableEntriesByDiscardRank = (
  scoredKeepDiscards: readonly ScoredKeepDiscard<Card>[],
): readonly (readonly [string, ComparableFields])[] =>
  [
    ...new Map(
      scoredKeepDiscards.map((scoredKeepDiscard) => [
        discardRankKey(scoredKeepDiscard.discard),
        toComparable(scoredKeepDiscard),
      ]),
    ).entries(),
  ].sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey));

describe("discard analysis under a global suit permutation", () => {
  it.each([
    {
      hand: "2S,5S,8S,QS,3H,7D",
      name: "a hand whose best keep is a four-card flush",
    },
    {
      hand: "JC,4D,6H,9S,2C,7H",
      name: "a hand whose kept Jack can score his nobs",
    },
  ])("scores $name identically to its permuted variant", ({ hand }) => {
    const cards = parseHand(hand);
    const permutedCards = permuteCardSuits(cards, ROTATE_SUITS);

    const originalResults = scoreDeal(cards);
    const permutedResults = scoreDeal(permutedCards);

    expect(comparableEntriesByDiscardRank(permutedResults)).toStrictEqual(
      comparableEntriesByDiscardRank(originalResults),
    );
    expect(discardRankKey(permutedResults[0]!.discard)).toBe(
      discardRankKey(originalResults[0]!.discard),
    );
  });
});
