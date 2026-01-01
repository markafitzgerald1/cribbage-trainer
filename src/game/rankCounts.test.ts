import { INDICES_PER_SUIT, Rank } from "./Card";
import { describe, expect, it } from "@jest/globals";
import { rankCounts } from "./rankCounts";

describe("rankCounts", () => {
  it("are all zero for an empty array", () => {
    expect(rankCounts([])).toStrictEqual(
      Array<number>(INDICES_PER_SUIT).fill(0),
    );
  });

  it("is one for a single index given a single card", () => {
    const rank = Rank.SEVEN;
    const expectedCounts = new Array(INDICES_PER_SUIT)
      .fill(0)
      // eslint-disable-next-line jest/no-conditional-in-test
      .map((_, index) => ((index as Rank) === rank ? 1 : 0));

    expect(rankCounts([{ rank }])).toStrictEqual(expectedCounts);
  });

  it("for one repeated, non-contiguous rank and one other rank", () => {
    const repeatedRank = Rank.SEVEN;
    const repeatCount = 2;
    const nonRepeatedRank = Rank.QUEEN;
    const expectedCounts = new Array(INDICES_PER_SUIT)
      .fill(0)
      .map((_, index) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if ((index as Rank) === repeatedRank) return repeatCount;
        // eslint-disable-next-line jest/no-conditional-in-test
        if ((index as Rank) === nonRepeatedRank) return 1;
        return 0;
      });

    expect(
      rankCounts([
        { rank: repeatedRank },
        { rank: nonRepeatedRank },
        { rank: repeatedRank },
      ]),
    ).toStrictEqual(expectedCounts);
  });
});
