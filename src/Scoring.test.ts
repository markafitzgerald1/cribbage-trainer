import { describe, expect, test } from "@jest/globals";
import { pairsPoints } from "./Scoring";

describe("Scoring", () => {
  describe("pairsPoints", () => {
    test("two equal rank cards", () => {
      const expectedPoints = 2;
      const QUEEN = {
        count: 10,
        rankLabel: "Q",
        rankValue: 11,
      };
      expect(pairsPoints([QUEEN, QUEEN])).toBe(expectedPoints);
    });
  });
});
