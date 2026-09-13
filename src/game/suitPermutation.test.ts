import { SUITS, Suit, parseHand } from "./Card";
import { describe, expect, it } from "@jest/globals";
import { permuteCardSuits, suitPermutationForAttempt } from "./suitPermutation";

const HAND_KEY = "5H,6H,7H,8H,9H,10H|Dealer";
const HAND_CARDS = parseHand("5H,6H,7H,8H,9H,10H");
const OTHER_HAND_KEY = "2C,3C,4C,5C,6C,7C|Dealer";
const OTHER_HAND_CARDS = parseHand("2C,3C,4C,5C,6C,7C");
const ATTEMPT_SAMPLE_SIZE = 12;
const IDENTITY_CHECK_SAMPLE_SIZE = 50;

const sortedSuits = (suits: readonly string[]): string[] => [...suits].sort();

const permutationsForAttempts = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, attemptIndex) =>
    suitPermutationForAttempt(HAND_CARDS, HAND_KEY, attemptIndex).join(""),
  );

describe("suitPermutationForAttempt", () => {
  it("returns a bijection of the four suits", () => {
    const permutation = suitPermutationForAttempt(HAND_CARDS, HAND_KEY, 1);

    expect(sortedSuits(permutation)).toStrictEqual(sortedSuits(SUITS));
  });

  it("is deterministic for the same hand and attempt", () => {
    const first = suitPermutationForAttempt(HAND_CARDS, HAND_KEY, 3);
    const second = suitPermutationForAttempt(HAND_CARDS, HAND_KEY, 3);

    expect(second).toStrictEqual(first);
  });

  it("varies across attempts of the same hand", () => {
    const permutations = permutationsForAttempts(ATTEMPT_SAMPLE_SIZE);

    expect(new Set(permutations).size).toBeGreaterThan(1);
  });

  it("varies across hands for the same attempt", () => {
    const permutations = [
      [HAND_CARDS, HAND_KEY] as const,
      [OTHER_HAND_CARDS, OTHER_HAND_KEY] as const,
    ].map(([cards, handKey]) =>
      suitPermutationForAttempt(cards, handKey, 1).join(""),
    );

    expect(new Set(permutations).size).toBe(2);
  });

  it("never picks the identity mapping, so the board always visibly changes", () => {
    const identity = SUITS.join("");
    const permutations = permutationsForAttempts(IDENTITY_CHECK_SAMPLE_SIZE);

    expect(permutations).not.toContain(identity);
  });

  /*
   * A single-suited hand is the sharpest case: fixing that one suit and
   * shuffling the other three among themselves is non-identity overall
   * (the plain identity check above would not catch it) while leaving this
   * hand's own suit completely unchanged. `HAND_CARDS` is all hearts for
   * exactly this reason — 5 of the 23 non-identity permutations fix hearts,
   * so scanning enough attempts would hit one if the used-suit filter
   * regressed.
   */
  it("always relabels a single-suited hand's own suit, not just some suit", () => {
    const heartsIndex = SUITS.indexOf(Suit.HEARTS);
    const heartsTargets = Array.from(
      { length: IDENTITY_CHECK_SAMPLE_SIZE },
      (_, attemptIndex) =>
        suitPermutationForAttempt(HAND_CARDS, HAND_KEY, attemptIndex).at(
          heartsIndex,
        ),
    );

    expect(heartsTargets).not.toContain(Suit.HEARTS);
  });
});

describe("permuteCardSuits", () => {
  it("relabels every card's suit and leaves rank untouched", () => {
    const permutation = suitPermutationForAttempt(HAND_CARDS, HAND_KEY, 1);

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
    const permutation = suitPermutationForAttempt(HAND_CARDS, HAND_KEY, 2);

    const permuted = permuteCardSuits(cards, permutation);

    expect(permuted[0]!.suit).toBe(permuted[4]!.suit);
    expect(permuted[1]!.suit).toBe(permuted[5]!.suit);
  });
});
