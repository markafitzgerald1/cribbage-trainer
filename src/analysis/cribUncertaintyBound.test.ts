import {
  CribRole,
  type ExpectedCribDeal,
  expectedCribPointsByStarterRank,
} from "../game/expectedCribPoints";
import { describe, expect, it } from "@jest/globals";
import type { CribUncertainty } from "../game/cribUncertainty";
import { cribUncertaintyBound } from "./cribUncertaintyBound";
import { expectedCribPointsTable } from "./analysis.test.common";
import { parseHand } from "../game/Card";
import { parsedOrThrow } from "../game/cribUncertainty.test.common";
import shippedSidecar from "../game/expectedCribPointsUncertainty.json";

/*
 * An unsuited discard of two distinct ranks has no starter-suit relations, so
 * every starter rank reads its rank's root record. The suited discard beside
 * it has relations for most ranks, so it reads relation records instead - the
 * distinction this bound must not blur.
 */
const ROOT_HAND = "AC,2D,5H,7S,9C,KD";
const RELATION_HAND = "AS,2S,5H,7D,9C,KD";
const EXHAUSTED_RANK_HAND = "9D,9C,9H,9S,4C,3S";

const UNIFORM_STANDARD_ERROR = 0.25;
const ROOT_STANDARD_ERROR = 0.4;
const RELATION_STANDARD_ERROR = 0.1;

const dealOf = (hand: string): ExpectedCribDeal => {
  const cards = parseHand(hand);
  return {
    discard: cards.slice(0, 2),
    knownCards: cards,
    role: CribRole.Dealer,
  };
};

const boundOf = (hand: string, uncertainty: CribUncertainty): number | null => {
  const deal = dealOf(hand);
  return cribUncertaintyBound({
    ...deal,
    cribStarterPoints: expectedCribPointsByStarterRank({
      ...deal,
      table: expectedCribPointsTable,
    }),
    uncertainty,
  });
};

const SHIPPED = parsedOrThrow(shippedSidecar);
const NO_RECORDS: CribUncertainty = { totals: new Map<string, number>() };

const everyRecord = (standardError: number): CribUncertainty => ({
  totals: { get: () => standardError },
});

const bySlot = (
  slotStandardErrors: Readonly<Record<string, number | undefined>>,
): CribUncertainty => ({
  totals: {
    get: (identity) =>
      Reflect.get(
        slotStandardErrors,
        identity.slice(identity.lastIndexOf("/") + 1),
      ),
  },
});

describe("cribUncertaintyBound", () => {
  it.each([
    { hand: ROOT_HAND, name: "a root-only discard" },
    { hand: RELATION_HAND, name: "a discard with starter-suit relations" },
    {
      hand: EXHAUSTED_RANK_HAND,
      name: "a discard whose rank has no starters left",
    },
  ])(
    "weights $name so that a uniform standard error survives unchanged",
    ({ hand }) => {
      expect(boundOf(hand, everyRecord(UNIFORM_STANDARD_ERROR))).toBeCloseTo(
        UNIFORM_STANDARD_ERROR,
        10,
      );
    },
  );

  it("reads root records for a discard with no starter-suit relations", () => {
    expect(
      boundOf(
        ROOT_HAND,
        bySlot({
          matching_discard_suit: RELATION_STANDARD_ERROR,
          non_matching_discard_suit: RELATION_STANDARD_ERROR,
          total: ROOT_STANDARD_ERROR,
        }),
      ),
    ).toBeCloseTo(ROOT_STANDARD_ERROR, 10);
  });

  it("reads relation records rather than root records where the average used them", () => {
    expect(
      boundOf(
        RELATION_HAND,
        bySlot({
          matching_discard_suit: RELATION_STANDARD_ERROR,
          matching_rank_1_suit: RELATION_STANDARD_ERROR,
          matching_rank_2_suit: RELATION_STANDARD_ERROR,
          non_matching_discard_suit: RELATION_STANDARD_ERROR,
          total: ROOT_STANDARD_ERROR,
        }),
      ),
    ).toBeCloseTo(RELATION_STANDARD_ERROR, 10);
  });

  it("is unavailable rather than zero when a consumed record is absent", () => {
    expect(boundOf(ROOT_HAND, everyRecord(0))).toBe(0);
    expect(boundOf(ROOT_HAND, NO_RECORDS)).toBeNull();
  });

  it("never falls back to a root record for a relation the sidecar omits", () => {
    expect(
      boundOf(RELATION_HAND, bySlot({ total: ROOT_STANDARD_ERROR })),
    ).toBeNull();
  });

  it("bounds the shipped sidecar's crib average at a few hundredths of a point", () => {
    expect(boundOf(ROOT_HAND, SHIPPED)).toBeCloseTo(0.0174, 4);
    expect(boundOf(RELATION_HAND, SHIPPED)).toBeCloseTo(0.0233, 4);
  });
});
