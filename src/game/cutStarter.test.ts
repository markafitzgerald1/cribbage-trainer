import { type Card, DECK, isSamePhysicalCard, parseHand } from "./Card";
import { describe, expect, it } from "@jest/globals";
import { cutForHand } from "./cutStarter";
import { dealHand } from "./dealHand";
import seedrandom from "seedrandom";

const HAND = "KH,QS,10D,9C,6S,5H";

const physicalKey = (card: Card) => `${card.rank}-${card.suit}`;

const cutCards = (hand: string): readonly Card[] => {
  const cut = cutForHand(parseHand(hand));
  return [cut.starter, ...cut.opponentCribCards];
};

const isIn = (cards: readonly Card[], card: Card) =>
  cards.some((other) => isSamePhysicalCard(card, other));

const SAMPLED_HAND_COUNT = 60;
const MINIMUM_DISTINCT_STARTERS = 20;

const sampledStarters = () =>
  Array.from({ length: SAMPLED_HAND_COUNT }, (_, index) =>
    physicalKey(cutForHand(dealHand(seedrandom(`hand-${index}`))).starter),
  );

describe("cutForHand", () => {
  it("draws a starter from the deck and two crib cards for the opponent", () => {
    const cut = cutForHand(parseHand(HAND));

    expect(cut.opponentCribCards).toHaveLength(2);
    expect(isIn(DECK, cut.starter)).toBe(true);
  });

  it("draws three distinct cards", () => {
    const drawn = cutCards(HAND);

    expect(new Set(drawn.map(physicalKey)).size).toBe(drawn.length);
  });

  it("never draws a card the hand already holds", () => {
    const dealt = parseHand(HAND);

    expect(cutCards(HAND).some((card) => isIn(dealt, card))).toBe(false);
  });

  it("returns the same cut for the same hand", () => {
    expect(cutForHand(parseHand(HAND))).toStrictEqual(
      cutForHand(parseHand(HAND)),
    );
  });

  it("returns the same cut when the same six cards arrive in another order", () => {
    expect(cutForHand(parseHand("5H,6S,9C,10D,QS,KH"))).toStrictEqual(
      cutForHand(parseHand(HAND)),
    );
  });

  it("returns a different cut for a hand differing in one suit", () => {
    expect(cutForHand(parseHand("KH,QS,10D,9C,6S,5S"))).not.toStrictEqual(
      cutForHand(parseHand(HAND)),
    );
  });

  /*
   * The hazard #717 names, asserted here as well as end to end in
   * `tests-e2e/starterCut.spec.ts`: a cut drawn from the shared generator
   * would move every later deal of a seeded session, silently.
   */
  it("leaves an injected generator's later deals untouched", () => {
    const seed = "a fixed seed";
    const cutGenerator = seedrandom(seed);
    const firstHand = dealHand(cutGenerator);
    cutForHand(firstHand);
    const untouchedGenerator = seedrandom(seed);
    dealHand(untouchedGenerator);

    expect(dealHand(cutGenerator)).toStrictEqual(dealHand(untouchedGenerator));
  });

  // A degenerate hash would map many hands onto one card, which no other assertion here would notice.
  it("spreads starters across the deck rather than piling them onto one card", () => {
    expect(new Set(sampledStarters()).size).toBeGreaterThan(
      MINIMUM_DISTINCT_STARTERS,
    );
  });
});
