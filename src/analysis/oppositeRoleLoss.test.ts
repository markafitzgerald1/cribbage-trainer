import { describe, expect, it } from "@jest/globals";
import {
  expectedCribPointsTable,
  expectedPlayPointsTable,
} from "./analysis.test.common";
import {
  oppositeCribRole,
  oppositeRoleExpectedPointsLoss,
  roleLossPairLabel,
} from "./oppositeRoleLoss";
import { CribRole } from "../game/expectedCribPoints";
import { parseHand } from "../game/Card";

const tables = { crib: expectedCribPointsTable, play: expectedPlayPointsTable };

/*
 * Discarding the 9 of diamonds and the 3 of spades from this hand is exactly
 * equal-best as pone and gives up 3.11 points as dealer, which is the
 * widest gap between the two roles that any fixture here needs.
 */
const ROLE_SENSITIVE_HAND = "9D,9C,9H,4C,4H,3S";
const ROLE_SENSITIVE_DISCARD = "9D,3S";

/*
 * Discarding the king of hearts and the 6 of spades here loses 3.46 as
 * dealer and 0.82 as pone: sub-optimal under both, so both figures are
 * positive and neither role looks like the one the discard was meant for.
 */
const ROLE_INSENSITIVE_HAND = "KH,QS,10D,9C,6S,5H";
const ROLE_INSENSITIVE_DISCARD = "KH,6S";

const lossUnderOppositeRole = (
  cards: string,
  cribRole: CribRole,
  discard: string,
) =>
  oppositeRoleExpectedPointsLoss({
    cards: parseHand(cards),
    chosenDiscardCards: parseHand(discard),
    cribRole,
    tables,
  });

const DECIMALS = 2;

describe("opposite crib role", () => {
  it.each([
    { cribRole: CribRole.Dealer, expected: CribRole.Pone },
    { cribRole: CribRole.Pone, expected: CribRole.Dealer },
  ])("reverses $cribRole", ({ cribRole, expected }) => {
    expect(oppositeCribRole(cribRole)).toBe(expected);
  });
});

describe("cost of a discard under the reversed crib role", () => {
  it("is zero when the discard is exactly best for the role not held", () => {
    expect(
      lossUnderOppositeRole(
        ROLE_SENSITIVE_HAND,
        CribRole.Dealer,
        ROLE_SENSITIVE_DISCARD,
      ),
    ).toBe(0);
  });

  it("is the actual-role cost seen from the other side, for the same discard", () => {
    expect(
      lossUnderOppositeRole(
        ROLE_SENSITIVE_HAND,
        CribRole.Pone,
        ROLE_SENSITIVE_DISCARD,
      ),
    ).toBeCloseTo(3.11, DECIMALS);
  });

  it.each([
    { cribRole: CribRole.Dealer, expected: 0.82, name: "dealer" },
    { cribRole: CribRole.Pone, expected: 3.46, name: "pone" },
  ])(
    "is positive under both roles for a discard wrong under both, as $name",
    ({ cribRole, expected }) => {
      expect(
        lossUnderOppositeRole(
          ROLE_INSENSITIVE_HAND,
          cribRole,
          ROLE_INSENSITIVE_DISCARD,
        ),
      ).toBeCloseTo(expected, DECIMALS);
    },
  );
});

describe("wording for a pair of role costs", () => {
  it.each([
    {
      actualLoss: 3.05,
      cribRole: CribRole.Dealer,
      expectedAccessible: "3.05 points lost as dealer, 0.00 as pone",
      expectedLabel: "3.05 as dealer, 0.00 as pone",
      name: "names the role held first",
      oppositeLoss: 0,
    },
    {
      actualLoss: 1.4,
      cribRole: CribRole.Pone,
      expectedAccessible: "1.40 points lost as pone, 2.60 as dealer",
      expectedLabel: "1.40 as pone, 2.60 as dealer",
      name: "states both costs when neither is zero",
      oppositeLoss: 2.6,
    },
  ])(
    "$name",
    ({
      actualLoss,
      cribRole,
      expectedAccessible,
      expectedLabel,
      oppositeLoss,
    }) => {
      expect(
        roleLossPairLabel(cribRole, actualLoss, oppositeLoss),
      ).toStrictEqual({
        accessibleLabel: expectedAccessible,
        label: expectedLabel,
      });
    },
  );

  // Every decision recorded before store version 6 has no reversed-role figure, and a missing one must not read as a measured zero.
  it("falls back to the single figure when the reversed-role cost is unknown", () => {
    expect(roleLossPairLabel(CribRole.Dealer, 3.05, null)).toStrictEqual({
      accessibleLabel: "3.05 points lost",
      label: "3.05 pts lost",
    });
  });
});
