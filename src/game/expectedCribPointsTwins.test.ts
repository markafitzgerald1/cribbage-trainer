import { STARTER_RANKS, type StarterRank } from "./expectedCribPoints";
import { describe, expect, it } from "@jest/globals";
import { expectedCribPointsTable } from "../analysis/analysis.test.common";

interface StarterBucket {
  readonly mu: number;
  readonly points: { readonly flushes: { readonly mu: number } };
}

type Role = "Dealer" | "Pone";

const ROLES: readonly Role[] = ["Dealer", "Pone"];
const CARDS_PER_RANK = 4;
const PRE_CUT_DENOMINATOR = 50;

type RoleBuckets = Record<Role, Record<StarterRank, StarterBucket>>;

const table = expectedCribPointsTable as unknown as Record<string, RoleBuckets>;

const bucketAt = (
  key: string,
  role: Role,
  starterRank: StarterRank,
): StarterBucket =>
  Reflect.get(Reflect.get(Reflect.get(table, key), role), starterRank);

const preCutMean = (
  key: string,
  role: Role,
  discardedRanks: readonly StarterRank[],
): number =>
  STARTER_RANKS.reduce((sum, starterRank) => {
    const remaining =
      CARDS_PER_RANK -
      discardedRanks.filter((rank) => rank === starterRank).length;
    return (
      sum +
      (remaining / PRE_CUT_DENOMINATOR) * bucketAt(key, role, starterRank).mu
    );
  }, 0);

const distinctRankPairs = STARTER_RANKS.flatMap((low, index) =>
  STARTER_RANKS.slice(index + 1).map((high) => ({ high, low })),
);

const withRoles = (pairs: readonly { high: StarterRank; low: StarterRank }[]) =>
  pairs.flatMap(({ high, low }) =>
    ROLES.map((role) => ({ high, low, name: `${low}_${high}/${role}`, role })),
  );

const sameRankPairs = STARTER_RANKS.map((rank) => ({ high: rank, low: rank }));

const flushValues = (
  key: string,
  role: Role,
  starterRanks: readonly StarterRank[],
): number[] =>
  starterRanks.map(
    (starterRank) => bucketAt(key, role, starterRank).points.flushes.mu,
  );

const nonJackPairCases = withRoles(
  distinctRankPairs.filter(({ high, low }) => low !== "J" && high !== "J"),
);

describe("vendored expected crib points suited and unsuited twins", () => {
  /*
   * Jack pairs are excluded rather than clamped: with 4H JH discarded, a cut
   * of rank 4 cannot be the 4H, so the discarded Jack's nobs chance differs
   * from the unsuited twin's and the suited pair can legitimately score less.
   * There is deliberately no per-cut suited-over-unsuited assertion:
   * simulate-cribbage-games#135 found it false for a faithful estimate, since
   * a starter matching either discarded rank cannot complete a flush and so
   * nothing offsets a negative rank residual there, and ruled that no per-cut
   * sign gate be built.
   */
  it.each(nonJackPairCases)(
    "pre-cut suited is at least unsuited for $name",
    ({ high, low, role }) => {
      /*
       * Weights follow the pre-cut definition in simulate-cribbage-games#135,
       * the crib_precut module of its artifact pipeline.
       */
      expect(
        preCutMean(`${low}_${high}_Suited`, role, [low, high]),
      ).toBeGreaterThanOrEqual(
        preCutMean(`${low}_${high}_Unsuited`, role, [low, high]),
      );
    },
  );

  /*
   * A suited pair's rank-mate in that suit is already in the crib, so a
   * starter of either discarded rank cannot complete the flush; an unsuited
   * pair can never make a crib flush.
   */
  it.each(withRoles(distinctRankPairs))(
    "suited flushes score only off the discarded ranks for $name",
    ({ high, low, role }) => {
      const key = `${low}_${high}_Suited`;
      const discarded = [low, high];

      expect(flushValues(key, role, discarded)).toStrictEqual([0, 0]);
      expect(
        flushValues(
          key,
          role,
          STARTER_RANKS.filter((rank) => !discarded.includes(rank)),
        ).every((flush) => flush > 0),
      ).toBe(true);
    },
  );

  it.each(withRoles([...distinctRankPairs, ...sameRankPairs]))(
    "unsuited flushes never score for $name",
    ({ high, low, role }) => {
      expect(
        flushValues(`${low}_${high}_Unsuited`, role, STARTER_RANKS).every(
          (flush) => flush === 0,
        ),
      ).toBe(true);
    },
  );
});
