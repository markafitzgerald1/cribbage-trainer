import { type Card, parseHand } from "./Card";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "./expectedCribPoints";
import { cutCounts } from "./cutCounts";

interface Scenario {
  readonly cribRole: CribRole;
  readonly discard: string;
  readonly keep: string;
  readonly opponentCribCards: string;
  readonly starter: string;
}

const countsFor = ({
  cribRole,
  discard,
  keep,
  opponentCribCards,
  starter,
}: Scenario) => {
  const [starterCard] = parseHand(starter) as [Card];
  return cutCounts({
    cribRole,
    discard: parseHand(discard),
    keep: parseHand(keep),
    opponentCribCards: parseHand(opponentCribCards),
    starter: starterCard,
  });
};

// The 29 hand: four fives and the jack whose suit the starter matches.
const PERFECT_HAND: Scenario = {
  cribRole: CribRole.Dealer,
  discard: "2C,3D",
  keep: "5C,5D,5H,JS",
  opponentCribCards: "9H,8D",
  starter: "5S",
};

/*
 * A crib of 2-4-6-8, whose ranks are all even and so cannot reach an odd
 * fifteen, with no pair, no run, and no jack. Its only scoring category left
 * is the flush, which is the one rule a crib does not share with a hand.
 */
const FLUSH_CRIB: Scenario = {
  cribRole: CribRole.Dealer,
  discard: "2S,4S",
  keep: "KH,QD,9C,7H",
  opponentCribCards: "6S,8S",
  starter: "QS",
};

const ROLE_SCENARIO: Scenario = {
  cribRole: CribRole.Dealer,
  discard: "5C,5D",
  keep: "2C,3D,4H,JS",
  opponentCribCards: "5H,JD",
  starter: "5S",
};

describe("cutCounts", () => {
  it("counts the kept hand with the starter using the shared scorer", () => {
    expect(countsFor(PERFECT_HAND).handPoints).toBe(29);
  });

  it("counts the crib from the discard, the opponent's two cards, and the starter", () => {
    // 2C 3D 9H 8D with a 5S starter: the single fifteen is 2 + 8 + 5.
    expect(countsFor(PERFECT_HAND).cribPoints).toBe(2);
  });

  it("adds the crib to the hand for the dealer", () => {
    const counts = countsFor(ROLE_SCENARIO);

    expect(counts.signedCribPoints).toBe(counts.cribPoints);
    expect(counts.total).toBe(counts.handPoints + counts.cribPoints);
  });

  it("subtracts the crib from the hand for the pone", () => {
    const counts = countsFor({ ...ROLE_SCENARIO, cribRole: CribRole.Pone });

    expect(counts.signedCribPoints).toBe(-counts.cribPoints);
    expect(counts.total).toBe(counts.handPoints - counts.cribPoints);
  });

  it("counts the same crib points for either role", () => {
    expect(
      countsFor({ ...ROLE_SCENARIO, cribRole: CribRole.Pone }).cribPoints,
    ).toBe(countsFor(ROLE_SCENARIO).cribPoints);
  });

  it("gives the crib five for a flush that runs to the starter", () => {
    expect(countsFor(FLUSH_CRIB).cribPoints).toBe(5);
  });

  /*
   * The crib flush rule is the one place a crib does not count like a hand, so
   * it is the one place this module could silently overstate a result.
   */
  it("gives the crib nothing for four matching suits without the starter", () => {
    expect(countsFor({ ...FLUSH_CRIB, starter: "QH" }).cribPoints).toBe(0);
  });
});
