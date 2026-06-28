import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import { getExpectedPlayBreakdownRows } from "./getExpectedPlayBreakdownRows";

const points = {
  dealer: {
    pointBreakdown: {
      fifteens: 2,
      go: 3,
      lastCard: 4,
      pairs: 5,
      runs: 6,
      thirtyOnes: 7,
    },
    total: 27,
  },
  delta: 6,
  pone: {
    pointBreakdown: {
      fifteens: 1,
      go: 2,
      lastCard: 3,
      pairs: 4,
      runs: 5,
      thirtyOnes: 6,
    },
    total: 21,
  },
} as const;

describe("getExpectedPlayBreakdownRows", () => {
  it.each([
    { expectedDelta: 6, role: CribRole.Dealer },
    { expectedDelta: -6, role: CribRole.Pone },
  ])(
    "returns absolute seats and the $role-relative delta",
    ({ expectedDelta, role }) => {
      const rows = getExpectedPlayBreakdownRows(points, role);

      expect(rows.map((row) => row.label)).toStrictEqual([
        "Pone",
        "Dealer",
        "You - Opp",
      ]);
      expect(
        rows[2]?.categories.map((category) => category.value),
      ).toStrictEqual([
        expectedDelta / 6,
        expectedDelta / 6,
        expectedDelta / 6,
        expectedDelta / 6,
        expectedDelta / 6,
        expectedDelta / 6,
        expectedDelta,
      ]);
    },
  );
});
