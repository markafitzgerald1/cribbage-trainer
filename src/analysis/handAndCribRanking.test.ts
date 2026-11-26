import {
  ScoredKeepDiscardSortKey,
  compareByExpectedScoreThenRankDescending,
  expectedHandAndCribPoints,
} from "./compareByExpectedScoreDescending";
import { describe, expect, it } from "@jest/globals";
import { parseHand, serializeHand } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import { scoreDeal } from "./analysis.test.common";

/*
 * Deals found by enumerating with the shipped tables, where the best discard
 * by hand plus signed crib differs from the best by net, by hand alone, by
 * signed crib alone, and by hand minus signed crib. A ranking that kept the
 * pegging term, dropped either term, or flipped the crib's sign picks a
 * different discard. For the pone the unsigned crib also picks a different
 * one; for the dealer the signed and unsigned crib are the same number.
 */
const CASES = [
  {
    bestByHandAndCrib: "AD,AS",
    bestByNet: "KC,10C",
    cards: "AD,10C,5D,9H,KC,AS",
    cribRole: CribRole.Dealer,
  },
  {
    bestByHandAndCrib: "9D,2S",
    bestByNet: "9D,7D",
    cards: "4C,5D,7D,3H,2S,9D",
    cribRole: CribRole.Pone,
  },
] as const;

const bestDiscard = (
  cards: string,
  cribRole: CribRole,
  sortKey: ScoredKeepDiscardSortKey,
): string => {
  const [best] = scoreDeal(parseHand(cards), cribRole).sort(
    compareByExpectedScoreThenRankDescending(sortKey),
  );
  return serializeHand(best?.discard ?? []);
};

describe("ranking by hand plus crib", () => {
  it("adds the signed crib to the expected hand", () => {
    expect(
      expectedHandAndCribPoints({
        expectedHandPoints: 3,
        signedExpectedCribPoints: -1.25,
      }),
    ).toBe(1.75);
  });

  it.each(CASES)(
    "ranks $cards as $cribRole by hand plus signed crib, without pegging",
    ({ bestByHandAndCrib, bestByNet, cards, cribRole }) => {
      expect(
        bestDiscard(
          cards,
          cribRole,
          ScoredKeepDiscardSortKey.ExpectedHandAndCribPoints,
        ),
      ).toBe(bestByHandAndCrib);
      expect(
        bestDiscard(
          cards,
          cribRole,
          ScoredKeepDiscardSortKey.ExpectedNetPoints,
        ),
      ).toBe(bestByNet);
    },
  );
});
