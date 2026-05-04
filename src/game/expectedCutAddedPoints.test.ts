import {
  type ExpectedCutAddedPoints,
  expectedCutAddedPoints,
} from "./expectedCutAddedPoints";
import { describe, expect, it } from "@jest/globals";
import { parseCards } from "./parseCards.common";

const assertAllZeros = (result: ExpectedCutAddedPoints): void => {
  expect(result.avgPairs).toBe(0);
  expect(result.avg15s).toBe(0);
  expect(result.avgRuns).toBe(0);
};

const assertGreaterThanHalf = (result: ExpectedCutAddedPoints): void => {
  expect(result.avg15s).toBeGreaterThan(0.5);
  expect(result.avgPairs).toBeGreaterThan(0.5);
  expect(result.avgRuns).toBeGreaterThan(0.5);
};

const assertOnly15s = (result: ExpectedCutAddedPoints): void => {
  expect(result.avgRuns).toBe(0);
  expect(result.avg15s).toBeGreaterThan(0);
  expect(result.avgPairs).toBe(0);
};

describe("expectedCutAddedPoints", () => {
  it.each([
    [
      "a highly reactive hand like A,2,3,7 which gains points on almost any cut",
      {
        assertResult: assertGreaterThanHalf,
        discardString: "8,9",
        keepString: "A,2,3,7",
      },
    ],
    [
      "pair contributions correctly for A,A,A,A",
      {
        assertResult: assertAllZeros,
        discardString: "2,3",
        keepString: "A,A,A,A",
      },
    ],
    [
      "average 15s for K,K,4,A hand",
      {
        assertResult: (result: ExpectedCutAddedPoints): void => {
          expect(result.avg15s).toBeCloseTo(1.48, 2);
          expect(result.avgPairs).toBeCloseTo(20 / 46);
        },
        discardString: "7,9",
        keepString: "K,K,4,A",
      },
    ],
    [
      "weight by remaining cards correctly",
      {
        assertResult: assertOnly15s,
        discardString: "6,7",
        keepString: "5,5,5,5",
      },
    ],
    [
      "sequential cards for runs",
      {
        assertResult: assertGreaterThanHalf,
        discardString: "8,9",
        keepString: "2,3,4,6",
      },
    ],
    [
      "edge case with all same rank",
      {
        assertResult: assertOnly15s,
        discardString: "3,4",
        keepString: "2,2,2,2",
      },
    ],
  ] as const)(
    "should calculate %s",
    (_, { assertResult, discardString, keepString }) => {
      const keep = parseCards(keepString);
      const discard = parseCards(discardString);
      const result = expectedCutAddedPoints(keep, discard);

      assertResult(result);

      expect(typeof result).toBe("object");
    },
  );

  it("should return structure with required numeric average properties", () => {
    const keep = parseCards("A,2,3,4");
    const discard = parseCards("5,6");
    const result = expectedCutAddedPoints(keep, discard);

    expect(typeof result.avg15s).toBe("number");
    expect(typeof result.avgPairs).toBe("number");
    expect(typeof result.avgRuns).toBe("number");
  });
});
