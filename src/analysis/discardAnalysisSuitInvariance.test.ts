import { type Card, SUITS, Suit, parseHand } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
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

/*
 * Every field `ScoredKeepDiscard` carries except `discard`, `keep`, and
 * `cribStarterPoints` themselves. The first two name specific (now
 * differently-suited) cards, so they are compared separately, by rank, via
 * `discardRankKey` below. `cribStarterPoints` embeds concrete remaining
 * suits of its own (which starters share a suit relation), so it needs the
 * relabeling `comparableCribStarterPoints` below rather than a byte-for-byte
 * match. Every field listed here, by contrast, is a plain number or a
 * rank-keyed breakdown with no suit information embedded, so it must come
 * out byte-identical under a global relabeling; a suit-sensitive regression
 * anywhere in the analysis engine would show up as a mismatch here rather
 * than being silently missed by a narrower list.
 */
interface ComparableFields {
  readonly avgCutAdded15s: number;
  readonly avgCutAddedFlushes: number;
  readonly avgCutAddedNobs: number;
  readonly avgCutAddedPairs: number;
  readonly avgCutAddedRuns: number;
  readonly expectedCribPointBreakdown: ScoredKeepDiscard<Card>["expectedCribPointBreakdown"];
  readonly expectedCribPoints: number;
  readonly expectedHandPoints: number;
  readonly expectedNetPoints: number;
  readonly expectedPlayPoints: ScoredKeepDiscard<Card>["expectedPlayPoints"];
  readonly handPoints: number;
  readonly handPointsBreakdown: ScoredKeepDiscard<Card>["handPointsBreakdown"];
  readonly signedExpectedCribPoints: number;
}

const toComparable = (
  scoredKeepDiscard: ScoredKeepDiscard<Card>,
): ComparableFields => ({
  avgCutAdded15s: scoredKeepDiscard.avgCutAdded15s,
  avgCutAddedFlushes: scoredKeepDiscard.avgCutAddedFlushes,
  avgCutAddedNobs: scoredKeepDiscard.avgCutAddedNobs,
  avgCutAddedPairs: scoredKeepDiscard.avgCutAddedPairs,
  avgCutAddedRuns: scoredKeepDiscard.avgCutAddedRuns,
  expectedCribPointBreakdown: scoredKeepDiscard.expectedCribPointBreakdown,
  expectedCribPoints: scoredKeepDiscard.expectedCribPoints,
  expectedHandPoints: scoredKeepDiscard.expectedHandPoints,
  expectedNetPoints: scoredKeepDiscard.expectedNetPoints,
  expectedPlayPoints: scoredKeepDiscard.expectedPlayPoints,
  handPoints: scoredKeepDiscard.handPoints,
  handPointsBreakdown: scoredKeepDiscard.handPointsBreakdown,
  signedExpectedCribPoints: scoredKeepDiscard.signedExpectedCribPoints,
});

// Relabels a concrete suit the same way `ROTATE_SUITS` relabels a card, so a value recorded in the original's suit space can be compared against the permuted result's.
const relabelSuit = (suit: Suit): Suit =>
  ROTATE_SUITS.at(SUITS.indexOf(suit)) as Suit;

/*
 * `cribStarterPoints` names, per starter rank, which concrete remaining
 * suits share each crib-scoring relation to the discard. That is real suit
 * data, not incidental to it, so proving invariance here means showing the
 * ORIGINAL deal's relabeled through the exact same permutation — not merely
 * discarding the field, which would silently stop checking it, and not
 * comparing it raw, which the mismatch above shows fails by construction.
 * `mapSuit` is `relabelSuit` for the original side and the identity for the
 * permuted side, which is already in the relabeled space. Suits within a
 * relation are sorted after mapping: a relabeling can permute which
 * concrete suits fall in one bucket without changing their enumeration
 * order, which carries no meaning of its own.
 */
const cribStarterPointsMappedThrough = (
  scoredKeepDiscard: ScoredKeepDiscard<Card>,
  mapSuit: (suit: Suit) => Suit,
): unknown =>
  scoredKeepDiscard.cribStarterPoints.map((starterPoints) => ({
    ...starterPoints,
    starterSuitRelationPoints: starterPoints.starterSuitRelationPoints.map(
      (relationPoints) => ({
        ...relationPoints,
        suits: relationPoints.suits.map(mapSuit).sort(),
      }),
    ),
  }));

const identitySuit = (suit: Suit): Suit => suit;

// The two discarded ranks, sorted — unique per candidate because every test hand below deals six distinct ranks, and suit-independent so it identifies the same decision across a relabeling.
const discardRankKey = (cards: readonly Card[]): string =>
  [...cards]
    .map((card) => card.rank)
    .sort((first, second) => first - second)
    .join(",");

// Projects every candidate discard to a value keyed by its rank pair rather than its position, so the two sides of a comparison line up by decision even if a suit-sensitive sort tie-break reordered them.
function byDiscardRank<Projected>(
  scoredKeepDiscards: readonly ScoredKeepDiscard<Card>[],
  project: (scoredKeepDiscard: ScoredKeepDiscard<Card>) => Projected,
): readonly (readonly [string, Projected])[] {
  return [
    ...new Map(
      scoredKeepDiscards.map((scoredKeepDiscard) => [
        discardRankKey(scoredKeepDiscard.discard),
        project(scoredKeepDiscard),
      ]),
    ).entries(),
  ].sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey));
}

describe("discard analysis under a global suit permutation", () => {
  it.each([
    {
      hand: "2S,5S,8S,QS,3H,7D",
      name: "a hand whose best keep is a four-card flush, as Dealer",
      role: CribRole.Dealer,
    },
    {
      hand: "JC,4D,6H,9S,2C,7H",
      name: "a hand whose kept Jack can score his nobs, as Pone",
      role: CribRole.Pone,
    },
  ])("scores $name identically to its permuted variant", ({ hand, role }) => {
    const cards = parseHand(hand);
    const permutedCards = permuteCardSuits(cards, ROTATE_SUITS);

    const originalResults = scoreDeal(cards, role);
    const permutedResults = scoreDeal(permutedCards, role);

    expect(byDiscardRank(permutedResults, toComparable)).toStrictEqual(
      byDiscardRank(originalResults, toComparable),
    );
    expect(
      byDiscardRank(permutedResults, (scoredKeepDiscard) =>
        cribStarterPointsMappedThrough(scoredKeepDiscard, identitySuit),
      ),
    ).toStrictEqual(
      byDiscardRank(originalResults, (scoredKeepDiscard) =>
        cribStarterPointsMappedThrough(scoredKeepDiscard, relabelSuit),
      ),
    );
    expect(discardRankKey(permutedResults[0]!.discard)).toBe(
      discardRankKey(originalResults[0]!.discard),
    );
  });
});
