/* jscpd:ignore-start */
import {
  ONE_SIDED_95_PERCENT_Z,
  cribDifferenceStandardErrorBound,
  discardLoss,
  discardNoiseThreshold,
  isWithinNoise,
  playDifferenceStandardError,
} from "./discardNoiseThreshold";
import {
  type WeightedIdentity,
  cribUncertaintyBound,
  cribWeightedIdentities,
} from "./cribUncertaintyBound";
import { describe, expect, it } from "@jest/globals";
import {
  expectedCribPointsTable,
  expectedPlayPointsTable,
} from "./analysis.test.common";
import { CribRole } from "../game/expectedCribPoints";
import { type Uncertainty } from "../game/uncertaintySidecar";
import { allScoredKeepDiscardsByExpectedNetScoreDescending } from "./analysis";
import { normalizePlayHandKey } from "../game/expectedPlayPoints";
import { parseHand } from "../game/Card";
import { playRecordIdentity } from "../game/playUncertainty";
import { uniformUncertainty } from "../game/uncertaintySidecar.test.common";
/* jscpd:ignore-end */

const UNIT_ERROR = 1;
const ROLE = CribRole.Dealer;
// Its best and second-best discards swap one king for the other, so they keep the same ranks.
const CARDS = parseHand("4H,5D,KH,6H,8C,KC");
const SCORED = allScoredKeepDiscardsByExpectedNetScoreDescending(CARDS, ROLE, {
  crib: expectedCribPointsTable,
  play: expectedPlayPointsTable,
});
type Candidate = (typeof SCORED)[number];

const playKeyOf = (
  candidate: Candidate,
): ReturnType<typeof normalizePlayHandKey> =>
  normalizePlayHandKey(candidate.keep);
const [BEST] = SCORED as [Candidate];
const SAME_RANKS = SCORED[1] as Candidate;
const DIFFERENT_RANKS = SCORED.find(
  (candidate) => playKeyOf(candidate) !== playKeyOf(BEST),
) as Candidate;

// 5H,6D and 5D,6H are the same unsuited 5-6 discard, so they read identical crib records.
const TWIN_CARDS = parseHand("5H,5D,6H,6D,9S,KC");
const TWIN_SCORED = allScoredKeepDiscardsByExpectedNetScoreDescending(
  TWIN_CARDS,
  ROLE,
  { crib: expectedCribPointsTable, play: expectedPlayPointsTable },
);
const discarding = (first: number, second: number): Candidate =>
  TWIN_SCORED.find(
    (candidate) =>
      candidate.discard.includes(
        TWIN_CARDS[first] as Candidate["discard"][number],
      ) &&
      candidate.discard.includes(
        TWIN_CARDS[second] as Candidate["discard"][number],
      ),
  ) as Candidate;

const EMPTY_TOTALS: ReadonlyMap<string, number> = new Map();
const missingOne = (absent: string): Uncertainty => ({
  totals: {
    get: (identity: string) =>
      identity === absent ? EMPTY_TOTALS.get(identity) : UNIT_ERROR,
  },
});

const compare = (
  chosen: Candidate,
  uncertainty: Uncertainty = uniformUncertainty(UNIT_ERROR),
) => ({
  best: BEST,
  chosen,
  cribUncertainty: uncertainty,
  knownCards: CARDS,
  playUncertainty: uncertainty,
  role: ROLE,
});

const singleBound = (candidate: Candidate): number =>
  cribUncertaintyBound({
    ...candidate,
    knownCards: CARDS,
    role: ROLE,
    uncertainty: uniformUncertainty(UNIT_ERROR),
  }) as number;

describe("discard noise threshold", () => {
  it("fixes z at the one-sided 95% standard-normal quantile", () => {
    expect(ONE_SIDED_95_PERCENT_Z).toBeCloseTo(1.6448536269514722, 15);
  });

  it("measures no error when a candidate is compared with itself", () => {
    const options = compare(BEST);

    expect(cribDifferenceStandardErrorBound(options)).toBe(0);
    expect(playDifferenceStandardError(options)).toBe(0);
    expect(discardNoiseThreshold(options)).toBe(0);
  });

  it("cancels crib records two discards share, where adding their single bounds would not", () => {
    const [fiveHearts, fiveDiamonds, sixHearts, sixDiamonds] = [0, 1, 2, 3];
    const twin = {
      ...compare(discarding(fiveHearts, sixDiamonds)),
      best: discarding(fiveDiamonds, sixHearts),
      knownCards: TWIN_CARDS,
    };

    expect(singleBound(twin.best) + singleBound(twin.chosen)).toBeGreaterThan(
      0,
    );
    expect(cribDifferenceStandardErrorBound(twin)).toBe(0);
  });

  it("adds crib records two discards do not share at full weight", () => {
    expect(
      cribDifferenceStandardErrorBound(compare(DIFFERENT_RANKS)),
    ).toBeCloseTo(singleBound(BEST) + singleBound(DIFFERENT_RANKS), 12);
  });

  it("reads one play record, and so no play error, for two keeps of the same ranks", () => {
    expect(playKeyOf(SAME_RANKS)).toBe(playKeyOf(BEST));
    expect(playDifferenceStandardError(compare(SAME_RANKS))).toBe(0);
  });

  it("adds two distinct play records in quadrature", () => {
    expect(playDifferenceStandardError(compare(DIFFERENT_RANKS))).toBeCloseTo(
      Math.SQRT2,
      12,
    );
  });

  it("combines crib and play errors in quadrature and scales by z", () => {
    const options = compare(DIFFERENT_RANKS);
    const crib = cribDifferenceStandardErrorBound(options) as number;
    const play = playDifferenceStandardError(options) as number;

    expect(discardNoiseThreshold(options)).toBeCloseTo(
      ONE_SIDED_95_PERCENT_Z * Math.hypot(crib, play),
      12,
    );
  });

  it.each([
    {
      absent: (
        cribWeightedIdentities({
          ...DIFFERENT_RANKS,
          role: ROLE,
        })[0] as WeightedIdentity
      ).identity,
      name: "a missing crib record",
    },
    {
      absent: playRecordIdentity({
        handKey: playKeyOf(DIFFERENT_RANKS),
        role: ROLE,
      }),
      name: "a missing play record",
    },
  ])("treats $name as unavailable, never as zero", ({ absent }) => {
    expect(
      discardNoiseThreshold(compare(DIFFERENT_RANKS, missingOne(absent))),
    ).toBeNull();
  });

  it("measures the loss at full precision from the net expectations", () => {
    expect(discardLoss(compare(DIFFERENT_RANKS))).toBeCloseTo(
      BEST.expectedNetPoints - DIFFERENT_RANKS.expectedNetPoints,
      6,
    );
  });

  it.each([
    { expected: false, loss: 0, name: "no loss", threshold: 1 },
    { expected: true, loss: 0.5, name: "a loss inside", threshold: 1 },
    { expected: true, loss: 1, name: "a loss exactly at", threshold: 1 },
    { expected: false, loss: 1.000001, name: "a loss just past", threshold: 1 },
    { expected: false, loss: 0.5, name: "an unavailable", threshold: null },
  ])("judges $name the threshold", ({ expected, loss, threshold }) => {
    expect(isWithinNoise(loss, threshold)).toBe(expected);
  });
});
