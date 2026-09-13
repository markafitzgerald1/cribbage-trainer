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

/*
 * One of the 23 non-identity bijections of the four suits, chosen
 * deterministically from a hand's identity and which attempt this is —
 * never from the shared `generateRandomNumber` stream, so loading this hand
 * into the drill never shifts a later seeded deal (see AGENTS.md's URL
 * analysis state section on that shared stream). Attempt 3 of a given hand
 * therefore always shows the same relabeling, while consecutive attempts
 * usually differ, and the hand is always visibly relabeled.
 */
export const suitPermutationForAttempt = (
  handKey: string,
  attemptIndex: number,
): readonly Suit[] => {
  const hash = hashString(`${handKey}#${attemptIndex}`);
  const index = hash % NON_IDENTITY_SUIT_PERMUTATIONS.length;
  /*
   * `index` is always within [0, 23) from the modulo above, so `.at()`
   * cannot return undefined here; the cast states that guarantee rather
   * than papering over a real chance of it (see mistakeQueue.ts's `itemAt`
   * for the same idiom).
   */
  return NON_IDENTITY_SUIT_PERMUTATIONS.at(index) as readonly Suit[];
};

const suitIndex = (suit: Suit): number => SUITS.indexOf(suit);

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
