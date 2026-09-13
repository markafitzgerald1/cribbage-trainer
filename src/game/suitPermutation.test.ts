import { SUITS, parseHand } from "./Card";
import { describe, expect, it } from "@jest/globals";
import { permuteCardSuits, suitPermutationForAttempt } from "./suitPermutation";

const HAND_KEY = "5H,6H,7H,8H,9H,10H|Dealer";
const OTHER_HAND_KEY = "2C,3C,4C,5C,6C,7C|Dealer";
const ATTEMPT_SAMPLE_SIZE = 12;
const IDENTITY_CHECK_SAMPLE_SIZE = 50;

const sortedSuits = (suits: readonly string[]): string[] => [...suits].sort();

const permutationsForAttempts = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, attemptIndex) =>
    suitPermutationForAttempt(HAND_KEY, attemptIndex).join(""),
  );

describe("suitPermutationForAttempt", () => {
  it("returns a bijection of the four suits", () => {
    const permutation = suitPermutationForAttempt(HAND_KEY, 1);

    expect(sortedSuits(permutation)).toStrictEqual(sortedSuits(SUITS));
  });

  it("is deterministic for the same hand and attempt", () => {
    const first = suitPermutationForAttempt(HAND_KEY, 3);
    const second = suitPermutationForAttempt(HAND_KEY, 3);

    expect(second).toStrictEqual(first);
  });

  it("varies across attempts of the same hand", () => {
    const permutations = permutationsForAttempts(ATTEMPT_SAMPLE_SIZE);

    expect(new Set(permutations).size).toBeGreaterThan(1);
  });

  it("varies across hands for the same attempt", () => {
    const permutations = [HAND_KEY, OTHER_HAND_KEY].map((handKey) =>
      suitPermutationForAttempt(handKey, 1).join(""),
    );

    expect(new Set(permutations).size).toBe(2);
  });

  it("never picks the identity mapping, so the board always visibly changes", () => {
    const identity = SUITS.join("");
    const permutations = permutationsForAttempts(IDENTITY_CHECK_SAMPLE_SIZE);

    expect(permutations).not.toContain(identity);
  });
});

describe("permuteCardSuits", () => {
  it("relabels every card's suit and leaves rank untouched", () => {
    const cards = parseHand("5H,6H,7H,8H,9H,10H");
    const permutation = suitPermutationForAttempt(HAND_KEY, 1);

    const permuted = permuteCardSuits(cards, permutation);

    expect(permuted.map((card) => card.rank)).toStrictEqual(
      cards.map((card) => card.rank),
    );
    expect(permuted.map((card) => card.rankLabel)).toStrictEqual(
      cards.map((card) => card.rankLabel),
    );
    expect(permuted.map((card) => card.count)).toStrictEqual(
      cards.map((card) => card.count),
    );
    expect(new Set(permuted.map((card) => card.suit)).size).toBe(1);
  });

  it("maps every card of one original suit to the same new suit", () => {
    const cards = parseHand("2C,3D,4H,5S,6C,7D");
    const permutation = suitPermutationForAttempt(HAND_KEY, 2);

    const permuted = permuteCardSuits(cards, permutation);

    expect(permuted[0]!.suit).toBe(permuted[4]!.suit);
    expect(permuted[1]!.suit).toBe(permuted[5]!.suit);
  });
});
