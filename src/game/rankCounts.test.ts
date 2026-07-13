import { INDICES_PER_SUIT, Rank } from "./Card";
import { describe, expect, it } from "@jest/globals";
import { rankCounts } from "./rankCounts";

const emptyRankCounts = () => Array<number>(INDICES_PER_SUIT).fill(0);

describe("rankCounts", () => {
  it("are all zero for an empty array", () => {
    expect(rankCounts([])).toStrictEqual(emptyRankCounts());
  });

  it("is one for a single index given a single card", () => {
    const rank = Rank.SEVEN;
    const expectedCounts = emptyRankCounts();
    expectedCounts[rank] = 1;

    expect(rankCounts([{ rank }])).toStrictEqual(expectedCounts);
  });

  it("for one repeated, non-contiguous rank and one other rank", () => {
    const repeatedRank = Rank.SEVEN;
    const repeatCount = 2;
    const nonRepeatedRank = Rank.QUEEN;
    const expectedCounts = emptyRankCounts();
    expectedCounts[repeatedRank] = repeatCount;
    expectedCounts[nonRepeatedRank] = 1;

    expect(
      rankCounts([
        { rank: repeatedRank },
        { rank: nonRepeatedRank },
        { rank: repeatedRank },
      ]),
    ).toStrictEqual(expectedCounts);
  });
});
