import { SUITS, Suit, parseHand } from "./Card";
import { describe, expect, it } from "@jest/globals";
import { permuteCardSuits, suitPermutationForView } from "./suitPermutation";

const HAND_KEY = "5H,6H,7H,8H,9H,10H|Dealer";
const HAND_CARDS = parseHand("5H,6H,7H,8H,9H,10H");
const OTHER_HAND_KEY = "2C,3C,4C,5C,6C,7C|Dealer";
const OTHER_HAND_CARDS = parseHand("2C,3C,4C,5C,6C,7C");
const VIEW_SAMPLE_SIZE = 12;
const IDENTITY_CHECK_SAMPLE_SIZE = 50;

const sortedSuits = (suits: readonly string[]): string[] => [...suits].sort();

const permutationsAcrossViews = (count: number): readonly (readonly Suit[])[] =>
  Array.from({ length: count }, (_, viewIndex) =>
    suitPermutationForView(HAND_CARDS, HAND_KEY, viewIndex),
  );

const permutationsForViews = (count: number): readonly string[] =>
  permutationsAcrossViews(count).map((permutation) => permutation.join(""));

const heartsTargetsAcrossViews = (
  count: number,
): readonly (Suit | undefined)[] => {
  const heartsIndex = SUITS.indexOf(Suit.HEARTS);
  return permutationsAcrossViews(count).map((permutation) =>
    permutation.at(heartsIndex),
  );
};

const expectNoConsecutiveRepeats = (values: readonly unknown[]) => {
  for (let index = 1; index < values.length; index += 1) {
    expect(values.at(index)).not.toBe(values.at(index - 1));
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
   * Defect: `movesAnyUsedSuit` (the prior name for this check) only ever
   * compared against the stored hand's own identity mapping, so two
   * consecutive views could leave a hand looking exactly like it did last
   * time — the used-suit check needs a per-view reference, not one
   * hardcoded to identity, or a mixed-suit hand could as easily repeat.
   * This is also the tightest case for the guarantee: only 18 of the 23
   * non-identity permutations move Hearts at all, and only a third of
   * those avoid whatever suit the previous view already sent Hearts to
   * (see suitPermutation.ts's own comment on this bound), so a
   * single-suited hand is what would surface a candidate pool run dry.
   * `usePracticeDrill.test.ts` covers the same guarantee end to end against
   * the exact mixed-suit hand this bug was reported and reproduced on.
   */
  it("never repeats a single-suited hand's own suit target between consecutive views", () => {
    const heartsTargets = heartsTargetsAcrossViews(IDENTITY_CHECK_SAMPLE_SIZE);

    expectNoConsecutiveRepeats(heartsTargets);
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
