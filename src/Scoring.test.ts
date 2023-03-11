import { describe, expect, it } from "@jest/globals";
import { pairsPoints } from "./Scoring";

describe("pairsPoints", () => {
  it("two equal rank cards", () => {
    const expectedPoints = 2;
    const QUEEN = {
      count: 10,
      rankLabel: "Q",
      rankValue: 11,
    };
    expect(pairsPoints([QUEEN, QUEEN])).toBe(expectedPoints);
  });
});
