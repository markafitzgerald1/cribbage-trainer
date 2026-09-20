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

describe("wording when the reversed role would have cost less", () => {
  it.each([
    {
      actualLoss: 3.05,
      cribRole: CribRole.Dealer,
      expectedAccessible: "3.05 points lost as dealer, 0.00 as pone",
      expectedCostsNothing: true,
      expectedLeading: "3.05 as dealer, ",
      expectedOpposite: "0.00 as pone",
      name: "names the role held first and marks the free reversed role",
      oppositeLoss: 0,
    },
    {
      actualLoss: 2.6,
      cribRole: CribRole.Pone,
      expectedAccessible: "2.60 points lost as pone, 1.40 as dealer",
      expectedCostsNothing: false,
      expectedLeading: "2.60 as pone, ",
      expectedOpposite: "1.40 as dealer",
      name: "states both costs and marks neither when both cost something",
      oppositeLoss: 1.4,
    },
    /*
     * A sub-cent loss prints as "< 0.01" rather than rounding to "0.00", so
     * the mark cannot be claimed by a cost that exists. This is the case a
     * near-zero tolerance would have swallowed, and the reason none is used.
     *
     * It is also the only case where the two spellings of the reversed-role
     * clause diverge, so it is what keeps the visible "<" out of the spoken
     * label.
     */
    {
      actualLoss: 1.4,
      cribRole: CribRole.Dealer,
      expectedAccessible: "1.40 points lost as dealer, less than 0.01 as pone",
      expectedCostsNothing: false,
      expectedLeading: "1.40 as dealer, ",
      expectedOpposite: "< 0.01 as pone",
      name: "withholds the mark from a reversed role that costs under a cent",
      oppositeLoss: 0.004,
    },
  ])(
    "$name",
    ({
      actualLoss,
      cribRole,
      expectedAccessible,
      expectedCostsNothing,
      expectedLeading,
      expectedOpposite,
      oppositeLoss,
    }) => {
      expect(
        roleLossPairLabel(cribRole, actualLoss, oppositeLoss),
      ).toStrictEqual({
        accessibleLabel: expectedAccessible,
        leadingText: expectedLeading,
        oppositeRoleCost: expectedOpposite,
        oppositeRoleCostsNothing: expectedCostsNothing,
      });
    },
  );
});

/*
 * The cost of the role actually held in the hand that prompted this rule: a
 * deal Mark played as dealer for 0.19, where naming the 2.00 it would have
 * cost as pone told him only that he was nearly right and would have been
 * more wrong under a role he did not have.
 */
const NEARLY_RIGHT_DEALER_LOSS = 0.19;

describe("wording when the reversed role offers nothing to compare against", () => {
  it.each([
    // Every decision recorded before store version 6 has no reversed-role figure, and a missing one must not read as a measured zero.
    { name: "was never measured", oppositeLoss: null },
    { name: "cost exactly the same", oppositeLoss: NEARLY_RIGHT_DEALER_LOSS },
    { name: "would have cost more", oppositeLoss: 2 },
  ])("states one figure when the reversed role $name", ({ oppositeLoss }) => {
    expect(
      roleLossPairLabel(
        CribRole.Dealer,
        NEARLY_RIGHT_DEALER_LOSS,
        oppositeLoss,
      ),
    ).toStrictEqual({
      accessibleLabel: "0.19 points lost",
      leadingText: "0.19 pts lost",
      oppositeRoleCost: "",
      oppositeRoleCostsNothing: false,
    });
  });
});
