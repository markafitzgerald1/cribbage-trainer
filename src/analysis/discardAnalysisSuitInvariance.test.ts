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
 * Every field `ScoredKeepDiscard` carries except `discard`, `keep`, and the
 * suit-sensitive fields handled separately below. `discard`/`keep` name
 * specific (now differently-suited) cards, so they are compared by rank via
 * `discardRankKey`. `cribStarterPoints` and the five `*Contributions`
 * arrays each embed concrete suits of their own — which starters or which
 * remaining cut cards produced a given relation — so they need
 * `suitSensitiveFieldsMappedThrough` below rather than a byte-for-byte
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
  readonly cutCountsRemaining: ScoredKeepDiscard<Card>["cutCountsRemaining"];
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
  cutCountsRemaining: scoredKeepDiscard.cutCountsRemaining,
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

const identitySuit = (suit: Suit): Suit => suit;

/*
 * `cribStarterPoints` names, per starter rank, which concrete remaining
 * suits share each crib-scoring relation to the discard. Suits within a
 * relation are sorted after mapping: a relabeling can permute which
 * concrete suits fall in one bucket without changing their enumeration
 * order, which carries no meaning of its own.
 */
const cribStarterPointsMappedThrough = (
  scoredKeepDiscard: ScoredKeepDiscard<Card>,
  mapSuit: (suit: Suit) => Suit,
) =>
  scoredKeepDiscard.cribStarterPoints.map((starterPoints) => ({
    ...starterPoints,
    starterSuitRelationPoints: starterPoints.starterSuitRelationPoints.map(
      (relationPoints) => ({
        ...relationPoints,
        suits: relationPoints.suits.map(mapSuit).sort(),
      }),
    ),
  }));

type Contribution = ScoredKeepDiscard<Card>["fifteensContributions"][number];

/*
 * Each of the five `*Contributions` arrays names, per category, which
 * specific remaining card would add its points if cut as the starter — so
 * `cutCard` carries a concrete suit of its own. Sorted by (rank, mapped
 * suit) after mapping so a matching physical card lands in the same
 * position on both sides regardless of which concrete suits a relabeling
 * assigns, the same reasoning as the starter-points sort above.
 */
const contributionsMappedThrough = (
  contributions: readonly Contribution[],
  mapSuit: (suit: Suit) => Suit,
): readonly Contribution[] =>
  contributions
    .map((contribution) => ({
      ...contribution,
      cutCard: {
        ...contribution.cutCard,
        suit: mapSuit(contribution.cutCard.suit),
      },
    }))
    .sort((first, second) =>
      first.cutCard.rank === second.cutCard.rank
        ? first.cutCard.suit.localeCompare(second.cutCard.suit)
        : first.cutCard.rank - second.cutCard.rank,
    );

const suitSensitiveFieldsMappedThrough = (
  scoredKeepDiscard: ScoredKeepDiscard<Card>,
  mapSuit: (suit: Suit) => Suit,
): unknown => ({
  cribStarterPoints: cribStarterPointsMappedThrough(scoredKeepDiscard, mapSuit),
  fifteensContributions: contributionsMappedThrough(
    scoredKeepDiscard.fifteensContributions,
    mapSuit,
  ),
  flushesContributions: contributionsMappedThrough(
    scoredKeepDiscard.flushesContributions,
    mapSuit,
  ),
  nobsContributions: contributionsMappedThrough(
    scoredKeepDiscard.nobsContributions,
    mapSuit,
  ),
  pairsContributions: contributionsMappedThrough(
    scoredKeepDiscard.pairsContributions,
    mapSuit,
  ),
  runsContributions: contributionsMappedThrough(
    scoredKeepDiscard.runsContributions,
    mapSuit,
  ),
});

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
        suitSensitiveFieldsMappedThrough(scoredKeepDiscard, identitySuit),
      ),
    ).toStrictEqual(
      byDiscardRank(originalResults, (scoredKeepDiscard) =>
        suitSensitiveFieldsMappedThrough(scoredKeepDiscard, relabelSuit),
      ),
    );
    expect(discardRankKey(permutedResults[0]!.discard)).toBe(
      discardRankKey(originalResults[0]!.discard),
    );
  });
});
