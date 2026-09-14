import { type Card, SUITS, type Suit } from "./Card";
import { Permutation } from "js-combinatorics";

/*
 * The 23 non-identity bijections of the four suits, built once from the
 * same SUITS order every other module uses. Non-identity overall does not
 * mean every suit moves — a transposition fixes two of the four — so this
 * set alone does not guarantee a given hand visibly changes, or that two
 * consecutive views of it differ from each other; the used-suit checks in
 * `suitPermutationForView` below are what guarantee those.
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
 * Whether `permutation` sends some suit the hand actually uses somewhere
 * different from where `reference` sends that same suit. Comparing against
 * the identity mapping (every suit mapped to itself) answers "does this
 * visibly change the stored hand"; comparing against a prior view's own
 * permutation answers "does this visibly change relative to what was just
 * shown" — the same question, generalized to an arbitrary reference instead
 * of one fixed to identity.
 */
const differsOnUsedSuits = (
  permutation: readonly Suit[],
  reference: readonly Suit[],
  usedSuits: ReadonlySet<Suit>,
): boolean =>
  [...usedSuits].some(
    (suit) => permutation.at(suitIndex(suit)) !== reference.at(suitIndex(suit)),
  );

/*
 * A named function rather than an inline arrow inside the loop below: an
 * arrow closing over the loop's own `previous` binding trips `no-loop-func`,
 * since ESLint cannot tell that each iteration's filter runs synchronously
 * before `previous` is reassigned. Taking `reference` as a parameter instead
 * of a closure sidesteps the question entirely.
 */
const candidatesRelabeling = (
  usedSuits: ReadonlySet<Suit>,
  reference: readonly Suit[],
): readonly (readonly Suit[])[] =>
  NON_IDENTITY_SUIT_PERMUTATIONS.filter(
    (permutation) =>
      differsOnUsedSuits(permutation, SUITS, usedSuits) &&
      differsOnUsedSuits(permutation, reference, usedSuits),
  );

/*
 * One of the non-identity bijections of the four suits, chosen
 * deterministically from the hand's identity and how many times THIS
 * SESSION has viewed it — never from the shared `generateRandomNumber`
 * stream, so loading this hand into the drill never shifts a later seeded
 * deal (see AGENTS.md's URL analysis state section on that shared stream).
 * `viewIndex` is a view count, not `MistakeQueueItem.attempts`: `attempts`
 * only advances on a committed Check discard, so keying the permutation on
 * it left every browse-and-back-out that never commits looking at the exact
 * same relabeling — recall, the one thing this feature exists to prevent.
 *
 * The contract is that a view is visibly relabeled relative to the view it
 * replaces: view 0 relative to the stored hand (there is no earlier view to
 * compare against), and every later view relative to the immediately
 * preceding one. "Usually differs" is not that contract — two attempt
 * indices whose hashes land on candidates that happen to agree on every
 * suit this hand uses would satisfy "usually" while silently showing the
 * same picture twice in a row. Each view is also still checked against the
 * stored hand itself, not only its immediate predecessor, so a longer
 * sequence can never drift back onto the literal recorded mistake and make
 * the "suits reshuffled" panel copy false again several views in.
 */
export const suitPermutationForView = (
  cards: readonly Card[],
  handKey: string,
  viewIndex: number,
): readonly Suit[] => {
  const usedSuits = new Set(cards.map((card) => card.suit));
  let previous: readonly Suit[] = SUITS;
  let current: readonly Suit[] = SUITS;
  for (let step = 0; step <= viewIndex; step += 1) {
    const candidates = candidatesRelabeling(usedSuits, previous);
    const hash = hashString(`${handKey}#${step}`);
    const index = hash % candidates.length;
    /*
     * `index` is always within [0, candidates.length) from the modulo
     * above, so `.at()` cannot return undefined here; the cast states that
     * guarantee rather than papering over a real chance of it (see
     * mistakeQueue.ts's `itemAt` for the same idiom). `candidates` is never
     * empty: differing from identity alone leaves at least 18 of the 23 (a
     * single used suit, the sharpest case — see the module comment above).
     * Of those 18, a hand's one used suit can only be sent to one of the
     * other three suits, six permutations to a destination, so excluding
     * whichever destination `previous` already used removes at most six,
     * leaving at least twelve. More used suits only relaxes this further:
     * differing from `previous` needs just one of them to land somewhere
     * new, not all of them.
     */
    current = candidates.at(index) as readonly Suit[];
    previous = current;
  }
  return current;
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
