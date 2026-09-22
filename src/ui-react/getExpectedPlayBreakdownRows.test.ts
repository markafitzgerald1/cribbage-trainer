import {
  type ExpectedPlayBreakdownCategory,
  getExpectedPlayBreakdownRows,
} from "./getExpectedPlayBreakdownRows";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";

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

const DELTA_STANDARD_ERROR = 0.02;
const toUncertainty = ({
  uncertainty = null,
}: ExpectedPlayBreakdownCategory): number | null => uncertainty;
const NO_UNCERTAINTIES = [null, null, null, null, null, null, null];

describe("getExpectedPlayBreakdownRows", () => {
  it.each([
    { expectedDelta: 6, role: CribRole.Dealer },
    { expectedDelta: -6, role: CribRole.Pone },
  ])(
    "returns absolute seats and the $role-relative delta",
    ({ expectedDelta, role }) => {
      // In real usage points.delta is role-relative, so match the role here.
      const rows = getExpectedPlayBreakdownRows(
        { ...points, delta: expectedDelta },
        role,
        DELTA_STANDARD_ERROR,
      );

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

  /*
   * The sidecar publishes one standard error per kept hand and role, against
   * the role-relative delta alone, so only the You - Opp total may carry one.
   * A seat total wearing the delta's error would be a figure nothing
   * measured.
   */
  it("carries the standard error on the delta total alone", () => {
    const rows = getExpectedPlayBreakdownRows(
      points,
      CribRole.Dealer,
      DELTA_STANDARD_ERROR,
    );

    expect(rows.map((row) => row.categories.map(toUncertainty))).toStrictEqual([
      NO_UNCERTAINTIES,
      NO_UNCERTAINTIES,
      [null, null, null, null, null, null, DELTA_STANDARD_ERROR],
    ]);
  });

  it("leaves the delta total without one when the sidecar is unavailable", () => {
    const rows = getExpectedPlayBreakdownRows(points, CribRole.Dealer, null);

    expect(rows[2]?.categories.at(-1)?.uncertainty).toBeNull();
  });
});
