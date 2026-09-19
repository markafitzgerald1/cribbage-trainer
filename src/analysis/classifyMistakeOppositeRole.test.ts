import { describe, expect, it } from "@jest/globals";
import {
  expectedCribPointsTable,
  expectedPlayPointsTable,
} from "./analysis.test.common";
import { oppositeCribRole, oppositeRoleLabel } from "./oppositeRoleLabel";
import { CribRole } from "../game/expectedCribPoints";
import { classifyMistake } from "./classifyMistake";
import { parseHand } from "../game/Card";

const tables = { crib: expectedCribPointsTable, play: expectedPlayPointsTable };

/*
 * Discarding 9♦ 3♠ from this hand is exactly equal-best as pone and gives up
 * 3.11 points as dealer, so it is the reversed-role mistake in its pure form
 * rather than a hand chosen to be near one.
 */
const ROLE_SENSITIVE_HAND = "9D,9C,9H,4C,4H,3S";
const ROLE_SENSITIVE_DISCARD = "9D,3S";

/*
 * Discarding K♥ 6♠ here loses 3.46 as dealer and 0.82 as pone: wrong under
 * both roles, which is ordinary crib misjudgment rather than a role misread.
 */
const ROLE_INSENSITIVE_HAND = "KH,QS,10D,9C,6S,5H";
const ROLE_INSENSITIVE_DISCARD = "KH,6S";

const classify = (cards: string, cribRole: CribRole, previousDiscard: string) =>
  classifyMistake({
    cards: parseHand(cards),
    cribRole,
    previousDiscard,
    tables,
  });

describe("opposite crib role", () => {
  it.each([
    { cribRole: CribRole.Dealer, expected: CribRole.Pone },
    { cribRole: CribRole.Pone, expected: CribRole.Dealer },
  ])("reverses $cribRole", ({ cribRole, expected }) => {
    expect(oppositeCribRole(cribRole)).toBe(expected);
  });

  it.each([
    {
      cribRole: CribRole.Dealer,
      expectedAccessible: "optimal as pone, not as dealer",
      expectedLabel: "Optimal as pone",
    },
    {
      cribRole: CribRole.Pone,
      expectedAccessible: "optimal as dealer, not as pone",
      expectedLabel: "Optimal as dealer",
    },
  ])(
    "names the reversed role as $expectedLabel",
    ({ cribRole, expectedAccessible, expectedLabel }) => {
      expect(oppositeRoleLabel(cribRole)).toStrictEqual({
        accessibleLabel: expectedAccessible,
        label: expectedLabel,
      });
    },
  );
});

describe("classifying a discard made for the wrong crib role", () => {
  it("flags a discard that is equal-best once the role is reversed, keeping the component decomposition intact", () => {
    const classification = classify(
      ROLE_SENSITIVE_HAND,
      CribRole.Dealer,
      ROLE_SENSITIVE_DISCARD,
    );

    expect(classification?.isOppositeRoleOptimal).toBe(true);
    expect(classification?.materialComponents).toContain("crib");
    expect(classification?.shortLabel).toContain("Crib");
  });

  it("returns no classification at all when the same discard is played in the role it suits", () => {
    expect(
      classify(ROLE_SENSITIVE_HAND, CribRole.Pone, ROLE_SENSITIVE_DISCARD),
    ).toBeNull();
  });

  it.each([
    { cribRole: CribRole.Dealer, name: "dealer" },
    { cribRole: CribRole.Pone, name: "pone" },
  ])(
    "does not flag a discard that is sub-optimal under both roles, as $name",
    ({ cribRole }) => {
      const classification = classify(
        ROLE_INSENSITIVE_HAND,
        cribRole,
        ROLE_INSENSITIVE_DISCARD,
      );

      expect(classification?.netLoss).toBeGreaterThan(0);
      expect(classification?.isOppositeRoleOptimal).toBe(false);
    },
  );

  it("skips the reversed-role enumeration when the discard cannot be parsed", () => {
    expect(classify(ROLE_SENSITIVE_HAND, CribRole.Dealer, "ZZ,YY")).toBeNull();
  });
});
