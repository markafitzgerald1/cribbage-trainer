import { type Card, SUITS, Suit, parseHand } from "./Card";
import { describe, expect, it } from "@jest/globals";
import {
  invertSuitPermutation,
  permuteCardSuits,
  suitPermutationForView,
} from "./suitPermutation";

const HAND_KEY = "5H,6H,7H,8H,9H,10H|Dealer";
const HAND_CARDS = parseHand("5H,6H,7H,8H,9H,10H");
const OTHER_HAND_KEY = "2C,3C,4C,5C,6C,7C|Dealer";
const OTHER_HAND_CARDS = parseHand("2C,3C,4C,5C,6C,7C");
/*
 * The reported bug's own reproduction hand: all four suits, so a check
 * that only one of them moves between views cannot pass here by using up
 * its one degree of freedom on an unused suit the way a single-suited
 * hand's could.
 */
const MIXED_SUIT_HAND_KEY = "10H,7D,5S,5D,AC,AS|Dealer";
const MIXED_SUIT_HAND_CARDS = parseHand("10H,7D,5S,5D,AC,AS");
const MIXED_SUIT_HAND_USED_SUITS = [
  Suit.HEARTS,
  Suit.DIAMONDS,
  Suit.SPADES,
  Suit.CLUBS,
];
const VIEW_SAMPLE_SIZE = 12;
const IDENTITY_CHECK_SAMPLE_SIZE = 50;

const sortedSuits = (suits: readonly string[]): string[] => [...suits].sort();

const permutationsAcrossViewsFor = (
  cards: readonly Card[],
  handKey: string,
  count: number,
): readonly (readonly Suit[])[] =>
  Array.from({ length: count }, (_, viewIndex) =>
    suitPermutationForView(cards, handKey, viewIndex),
  );

const permutationsAcrossViews = (count: number) =>
  permutationsAcrossViewsFor(HAND_CARDS, HAND_KEY, count);

const permutationsForViews = (count: number): readonly string[] =>
  permutationsAcrossViews(count).map((permutation) => permutation.join(""));

const targetsForSuit = (
  permutations: readonly (readonly Suit[])[],
  suit: Suit,
): readonly (Suit | undefined)[] => {
  const suitPosition = SUITS.indexOf(suit);
  return permutations.map((permutation) => permutation.at(suitPosition));
};

const heartsTargetsAcrossViews = (
  count: number,
): readonly (Suit | undefined)[] =>
  targetsForSuit(permutationsAcrossViews(count), Suit.HEARTS);

const expectNoConsecutiveRepeats = (values: readonly unknown[]) => {
  for (let index = 1; index < values.length; index += 1) {
    expect(values.at(index)).not.toBe(values.at(index - 1));
  }
};

const expectNoConsecutiveRepeatsPerSuit = (
  permutations: readonly (readonly Suit[])[],
  suits: readonly Suit[],
) => {
  for (const suit of suits) {
    expectNoConsecutiveRepeats(targetsForSuit(permutations, suit));
  }
};

describe("suitPermutationForView", () => {
  it("returns a bijection of the four suits", () => {
    const permutation = suitPermutationForView(HAND_CARDS, HAND_KEY, 1);

    expect(sortedSuits(permutation)).toStrictEqual(sortedSuits(SUITS));
  });

  it("is deterministic for the same hand and view", () => {
    const first = suitPermutationForView(HAND_CARDS, HAND_KEY, 3);
    const second = suitPermutationForView(HAND_CARDS, HAND_KEY, 3);

    expect(second).toStrictEqual(first);
  });

  it("varies across views of the same hand", () => {
    const permutations = permutationsForViews(VIEW_SAMPLE_SIZE);

    expect(new Set(permutations).size).toBeGreaterThan(1);
  });

  it("varies across hands for the same view", () => {
    const permutations = [
      [HAND_CARDS, HAND_KEY] as const,
      [OTHER_HAND_CARDS, OTHER_HAND_KEY] as const,
    ].map(([cards, handKey]) =>
      suitPermutationForView(cards, handKey, 1).join(""),
    );

    expect(new Set(permutations).size).toBe(2);
  });

  it("never picks the identity mapping, so the board always visibly changes", () => {
    const identity = SUITS.join("");
    const permutations = permutationsForViews(IDENTITY_CHECK_SAMPLE_SIZE);

    expect(permutations).not.toContain(identity);
  });

  /*
   * A single-suited hand is the sharpest case: fixing that one suit and
   * shuffling the other three among themselves is non-identity overall
   * (the plain identity check above would not catch it) while leaving this
   * hand's own suit completely unchanged. `HAND_CARDS` is all hearts for
   * exactly this reason — 5 of the 23 non-identity permutations fix hearts,
   * so scanning enough views would hit one if the used-suit filter
   * regressed.
   */
  it("always relabels a single-suited hand's own suit, not just some suit", () => {
    const heartsTargets = heartsTargetsAcrossViews(IDENTITY_CHECK_SAMPLE_SIZE);

    expect(heartsTargets).not.toContain(Suit.HEARTS);
  });

  /*
   * Defect: the used-suit check only ever compared against the stored
   * hand's own identity mapping, so two consecutive views could leave a
   * hand looking exactly like it did last time — the check needs a
   * per-view reference, not one fixed to identity. This is also the
   * tightest case for satisfiability: only 18 of the 23 non-identity
   * permutations move Hearts at all, split evenly three ways by which of
   * the other three suits they send Hearts to, so two thirds of those 18
   * avoid whichever one suit the previous view already sent Hearts to (see
   * suitPermutation.ts's own comment on this bound) — a single-suited hand
   * is what would surface a candidate pool run dry, not a generous one.
   */
  it("never repeats a single-suited hand's own suit target between consecutive views", () => {
    const heartsTargets = heartsTargetsAcrossViews(IDENTITY_CHECK_SAMPLE_SIZE);

    expectNoConsecutiveRepeats(heartsTargets);
  });

  /*
   * Defect: requiring only SOME used suit to differ (an earlier version of
   * this guarantee) let a mixed-suit hand keep most of its suits mapped
   * identically to the previous view while just one moved — the reported
   * bug's own reproduction left three of its six cards (5S, AC, AS)
   * unchanged between two committed drills. A single-suited hand's test
   * above cannot catch that: with only one used suit, "some" and "every"
   * are the same check. This hand uses all four, so each is checked
   * independently.
   */
  it("moves every suit a mixed-suit hand uses between consecutive views, not just one of them", () => {
    const permutations = permutationsAcrossViewsFor(
      MIXED_SUIT_HAND_CARDS,
      MIXED_SUIT_HAND_KEY,
      IDENTITY_CHECK_SAMPLE_SIZE,
    );

    expectNoConsecutiveRepeatsPerSuit(permutations, MIXED_SUIT_HAND_USED_SUITS);
  });
});

describe("permuteCardSuits", () => {
  it("relabels every card's suit and leaves rank untouched", () => {
    const permutation = suitPermutationForView(HAND_CARDS, HAND_KEY, 1);

    const permuted = permuteCardSuits(HAND_CARDS, permutation);

    expect(permuted.map((card) => card.rank)).toStrictEqual(
      HAND_CARDS.map((card) => card.rank),
    );
    expect(permuted.map((card) => card.rankLabel)).toStrictEqual(
      HAND_CARDS.map((card) => card.rankLabel),
    );
    expect(permuted.map((card) => card.count)).toStrictEqual(
      HAND_CARDS.map((card) => card.count),
    );
    expect(new Set(permuted.map((card) => card.suit)).size).toBe(1);
  });

  it("maps every card of one original suit to the same new suit", () => {
    const cards = parseHand("2C,3D,4H,5S,6C,7D");
    const permutation = suitPermutationForView(HAND_CARDS, HAND_KEY, 2);

    const permuted = permuteCardSuits(cards, permutation);

    expect(permuted[0]!.suit).toBe(permuted[4]!.suit);
    expect(permuted[1]!.suit).toBe(permuted[5]!.suit);
  });
});

describe("invertSuitPermutation", () => {
  const MIXED_SUITS_TO_INVERT = parseHand("2C,3D,4H,5S,6C,7D");

  /*
   * Across every view of every hand this file exercises, not one chosen
   * permutation, because an inverse that happened to be its own permutation
   * would pass a single case while losing the cards on any other.
   */
  it.each([...Array(VIEW_SAMPLE_SIZE).keys()])(
    "recovers the original cards from view %i",
    (viewIndex) => {
      const permutation = suitPermutationForView(
        MIXED_SUIT_HAND_CARDS,
        MIXED_SUIT_HAND_KEY,
        viewIndex,
      );

      const recovered = permuteCardSuits(
        permuteCardSuits(MIXED_SUITS_TO_INVERT, permutation),
        invertSuitPermutation(permutation),
      );

      expect(recovered).toStrictEqual(MIXED_SUITS_TO_INVERT);
    },
  );

  it("is itself a permutation of the four suits", () => {
    const permutation = suitPermutationForView(HAND_CARDS, HAND_KEY, 3);

    expect(sortedSuits(invertSuitPermutation(permutation))).toStrictEqual(
      sortedSuits(SUITS),
    );
  });
});
