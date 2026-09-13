import { type Card, SUITS, type Suit } from "./Card";
import { Permutation } from "js-combinatorics";

/*
 * The 23 bijections of the four suits that actually relabel every suit,
 * built once from the same SUITS order every other module uses. The
 * identity mapping is excluded: selecting it would leave the board showing
 * the stored arrangement verbatim while the panel still claimed the suits
 * had been reshuffled.
 */
const NON_IDENTITY_SUIT_PERMUTATIONS: readonly (readonly Suit[])[] = [
  ...new Permutation(SUITS),
].filter((permutation) =>
  permutation.some((suit, index) => suit !== SUITS.at(index)),
);

const HASH_MULTIPLIER = 31;
const HASH_MODULUS = 1_000_000_007;

/*
 * A plain multiply-mod rolling hash: no bit-level step is available under
 * this project's `no-bitwise`, and none is needed — the largest
 * intermediate product here, `(HASH_MODULUS - 1) * HASH_MULTIPLIER`, stays
 * far inside the range a double represents exactly.
 */
const hashString = (value: string): number =>
  Array.from(value).reduce(
    (hash, char) =>
      (hash * HASH_MULTIPLIER + char.charCodeAt(0)) % HASH_MODULUS,
    0,
  );

const suitIndex = (suit: Suit): number => SUITS.indexOf(suit);

/*
 * A permutation excluding the global identity can still leave a hand
 * visually unchanged: if the hand uses only some of the four suits, a
 * permutation that fixes every suit the hand actually uses — and only
 * shuffles the unused ones among themselves — is non-identity overall but
 * identity on this hand. A single-suited hand (an all-hearts flush, say)
 * has the most room for this: 5 of the 23 non-identity permutations fix
 * hearts while permuting the other three among themselves. Requiring at
 * least one USED suit to move rules those out; a hand using all four suits
 * can never trigger this, since any non-identity permutation must move one
 * of them.
 */
const movesAnyUsedSuit = (
  permutation: readonly Suit[],
  usedSuits: ReadonlySet<Suit>,
): boolean =>
  [...usedSuits].some((suit) => permutation.at(suitIndex(suit)) !== suit);

/*
 * One of the non-identity bijections of the four suits that also visibly
 * relabels this specific hand, chosen deterministically from the hand's
 * identity and which attempt this is — never from the shared
 * `generateRandomNumber` stream, so loading this hand into the drill never
 * shifts a later seeded deal (see AGENTS.md's URL analysis state section on
 * that shared stream). Attempt 3 of a given hand therefore always shows the
 * same relabeling, while consecutive attempts usually differ, and the hand
 * is always visibly relabeled regardless of how many suits it uses.
 */
export const suitPermutationForAttempt = (
  cards: readonly Card[],
  handKey: string,
  attemptIndex: number,
): readonly Suit[] => {
  const usedSuits = new Set(cards.map((card) => card.suit));
  const candidates = NON_IDENTITY_SUIT_PERMUTATIONS.filter((permutation) =>
    movesAnyUsedSuit(permutation, usedSuits),
  );
  const hash = hashString(`${handKey}#${attemptIndex}`);
  const index = hash % candidates.length;
  /*
   * `index` is always within [0, candidates.length) from the modulo above,
   * so `.at()` cannot return undefined here; the cast states that guarantee
   * rather than papering over a real chance of it (see mistakeQueue.ts's
   * `itemAt` for the same idiom). `candidates` is never empty: a hand using
   * all four suits keeps every one of the 23 non-identity permutations, and
   * even the most concentrated case — a single used suit — still leaves 18.
   */
  return candidates.at(index) as readonly Suit[];
};

/*
 * Cribbage has no trump, and suits affect scoring only through flushes and
 * his nobs — both preserved under a GLOBAL relabeling of suits, never a
 * per-card one, which would silently change what the hand is worth. Callers
 * must apply one permutation across every card of a hand (and any card drawn
 * from the same identity, such as a previously recorded discard) rather than
 * permute pieces separately.
 */
export function permuteCardSuits<CardType extends Card>(
  cards: readonly CardType[],
  permutation: readonly Suit[],
): CardType[] {
  return cards.map((card) => ({
    ...card,
    suit: permutation.at(suitIndex(card.suit)) as Suit,
  }));
}
