import { type Card, SUITS, serializeHand } from "./Card";
import { getRemainingDeck } from "./getRemainingDeck";

/*
 * One starter, and the two crib cards the opponent contributed, for a dealt
 * hand.
 *
 * The opponent's two are here because a crib is four cards plus the starter
 * and only two of them are the player's. The app has no opponent model, so
 * these are taken from what the deal left by the same derivation as the
 * starter, rather than chosen to represent what an opponent would throw: no
 * rule of thumb enters the count that way.
 *
 * They are not a random draw, and nothing here should describe them as one.
 * Like the starter they are a pure function of the dealt six, so they are the
 * same cards every time that hand is on the board — the derivation spreads
 * evenly over the unseen deck *across* hands, which is a property of the
 * mapping and not a draw made at runtime. They belong to the cut rather than
 * to either candidate discard so that comparing two discards holds them
 * fixed, which keeps the comparison about the discard rather than about the
 * crib's other half.
 */
export interface HandCut {
  readonly opponentCribCards: readonly Card[];
  readonly starter: Card;
}

/*
 * The multiplier and modulus of the minimal standard generator: the modulus is
 * prime and the multiplier is a primitive root of it, so the polynomial hash
 * below mixes across that whole range. Their largest intermediate product
 * stays under 2^47, well inside an exact double, which is what lets this hash
 * avoid bit-level arithmetic entirely.
 */
const HASH_MULTIPLIER = 48271;
const HASH_MODULUS = 2147483647;

/*
 * Wanted for a stable index rather than for any security property. Its output
 * is reduced modulo a deck of at most 46, whose bias against the modulus above
 * is roughly one part in forty million — orders of magnitude below anything a
 * single cut could express.
 */
const hashText = (text: string): number => {
  let hash = 1;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * HASH_MULTIPLIER + text.charCodeAt(index)) % HASH_MODULUS;
  }
  return hash;
};

const compareForCanonicalOrder = (first: Card, second: Card): number =>
  first.rank - second.rank ||
  SUITS.indexOf(first.suit) - SUITS.indexOf(second.suit);

/*
 * Rank-then-suit order rather than deal order, so the cut is a function of
 * which six cards were dealt and not of the order they arrived in: the same
 * six typed into the Enter-cards dialog in a different order are the same hand
 * and deserve the same cut.
 */
const canonicalHandKey = (dealtCards: readonly Card[]): string =>
  serializeHand([...dealtCards].sort(compareForCanonicalOrder));

/*
 * Splice rather than an index read, matching `dealHand`: it takes the card and
 * shrinks the deck in one step, leaving no bracket access for the
 * object-injection rule to reject and no unreachable `undefined` branch for
 * coverage to fail on.
 */
const drawFrom = (deck: Card[], handKey: string, salt: string): Card => {
  const index = hashText(`${salt}:${handKey}`) % deck.length;
  const [card] = deck.splice(index, 1) as [Card];
  return card;
};

// Two, because the opponent discards two cards to whoever's crib it is.
const OPPONENT_CRIB_SALTS = ["opponent-crib-1", "opponent-crib-2"] as const;

/*
 * The cut for a dealt hand, derived from the six cards themselves rather than
 * drawn from any random source.
 *
 * Deliberately a pure function and not a draw, for two reasons that both
 * matter. It cannot consume the injected generator, so a seeded deep link
 * keeps dealing the same six cards however many times a cut is computed or a
 * component re-renders — the hazard #717 names, and the one that fails
 * silently when got wrong. And it settles on the same starter across a reload,
 * a Back, a shared link, and a practice-drill replay of the hand, so there is
 * no way to re-roll a cut until a discard looks good.
 *
 * It depends on the dealt six and never on which two are discarded. A cut that
 * moved when the discard moved would hand the user that re-roll and would also
 * destroy the fixed-starter comparison this feature exists to make.
 */
export const cutForHand = (dealtCards: readonly Card[]): HandCut => {
  const deck = [...getRemainingDeck(dealtCards)];
  const handKey = canonicalHandKey(dealtCards);
  const starter = drawFrom(deck, handKey, "starter");
  const opponentCribCards = OPPONENT_CRIB_SALTS.map((salt) =>
    drawFrom(deck, handKey, salt),
  );
  return { opponentCribCards, starter };
};
