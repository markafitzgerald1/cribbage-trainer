import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import {
  type ScoredMistakeCandidate,
  classifyMistake,
  classifyScoredMistake,
  formatNetLoss,
} from "./classifyMistake";
import { describe, expect, it } from "@jest/globals";
import type { ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import { ZERO_EXPECTED_PLAY_POINTS } from "./analysis";
import expectedCribPointsTableData from "../game/expectedCribPointsTable.json";
import expectedPlayPointsTableData from "../game/expectedPlayPointsTable.json";
import { parseHand } from "../game/Card";
import { withoutFloatResidue } from "./discardQuality";

const tables = {
  crib: expectedCribPointsTableData as unknown as ExpectedCribPointsTable,
  play: expectedPlayPointsTableData as unknown as ExpectedPlayPointsTable,
};

const createMockCandidate = (
  values: readonly [hand: number, crib: number, play: number],
  net?: number,
): ScoredMistakeCandidate => {
  const [hand, crib, play] = values;
  return {
    expectedHandPoints: hand,
    expectedNetPoints: net ?? hand + crib + play,
    expectedPlayPoints: { ...ZERO_EXPECTED_PLAY_POINTS, delta: play },
    signedExpectedCribPoints: crib,
  };
};

const createFlushCandidate = (
  values: readonly [hand: number, crib: number, play: number],
  flushes: number,
): ScoredMistakeCandidate => ({
  ...createMockCandidate(values),
  avgCutAddedFlushes: flushes > 0 ? 0.2 : 0,
  handPointsBreakdown: {
    fifteens: 0,
    flushes,
    nobs: 0,
    pairs: 0,
    runs: 0,
    total: flushes,
  },
});

describe("classifyScoredMistake", () => {
  it("returns null when net loss is zero or negative", () => {
    const candidate = createMockCandidate([8, 2, 1]);

    expect(classifyScoredMistake(candidate, candidate)).toBeNull();
  });

  it.each([
    {
      best: [10, 2, 1] as const,
      chosen: [6, 2, 1] as const,
      dominant: ["hand"] as const,
      label: "Hand",
      name: "pure hand loss",
    },
    {
      best: [6, 5, 1] as const,
      chosen: [6, 1, 1] as const,
      dominant: ["crib"] as const,
      label: "Crib",
      name: "pure crib loss",
    },
    {
      best: [6, 2, 3] as const,
      chosen: [6, 2, 0] as const,
      dominant: ["play"] as const,
      label: "Play",
      name: "pure play loss",
    },
    {
      best: [8, 4, 1] as const,
      chosen: [6, 2.005, 1] as const,
      dominant: ["hand", "crib"] as const,
      label: "Hand, Crib",
      name: "hand and crib tie within 0.01 precision",
    },
    {
      best: [6, 5, 3] as const,
      chosen: [6, 3.004, 1] as const,
      dominant: ["crib", "play"] as const,
      label: "Crib, Play",
      name: "crib and play tie within 0.01 precision",
    },
    {
      best: [6, 4, 3] as const,
      chosen: [4, 2.004, 1.005] as const,
      dominant: ["hand", "crib", "play"] as const,
      label: "Hand, Crib, Play",
      name: "three-way tie within 0.01 precision",
    },
    {
      best: [8, 4, 1] as const,
      chosen: [6, 2.02, 1] as const,
      dominant: ["hand"] as const,
      label: "Hand",
      name: "separates components differing by more than 0.01",
    },
    {
      best: [8, 2, 1] as const,
      chosen: [10, -1, 0] as const,
      dominant: ["crib"] as const,
      gains: ["hand"] as const,
      label: "Crib loss > Hand gain",
      name: "detects trade-off when crib loss exceeds hand gain",
      shortLabel: "Crib > Hand",
    },
    {
      best: [6, 0, 0] as const,
      chosen: [1, 4, 0] as const,
      dominant: ["hand"] as const,
      gains: ["crib"] as const,
      label: "Hand loss > Crib gain",
      name: "detects trade-off when hand loss is partially offset by crib gain",
      shortLabel: "Hand > Crib",
    },
    {
      best: [9.72, 3.14, 1.56] as const,
      chosen: [8.24, 4.44, 1.64] as const,
      dominant: ["hand"] as const,
      gains: ["crib", "play"] as const,
      label: "Hand loss > Crib, Play gain",
      name: "authentic trade-off where both crib and play gain",
      shortLabel: "Hand > Crib, Play",
    },
    {
      best: [5, 2, 1] as const,
      chosen: [3, 3, 1 + 0.005] as const,
      dominant: ["hand"] as const,
      gains: ["crib", ...[]] as const,
      label: `${"Hand loss"} > Crib gain`,
      name: "authentic trade-off where play gain is below display precision",
      shortLabel: `${"Hand"} > Crib`,
    },
    {
      best: [1.456522, 0, 0] as const,
      chosen: [0, 0.928472, 0.4165] as const,
      dominant: ["hand"] as const,
      gains: ["crib", ...["play"]] as const,
      label: `${"Hand loss"} > Crib, Play gain`,
      name: "includes all material offsetting gains differing in magnitude",
      shortLabel: `${"Hand"} > Crib, Play`,
    },
    {
      best: [6, 2, 0] as const,
      chosen: [4.5, 2, 1.2] as const,
      dominant: ["hand"] as const,
      gains: ["play"] as const,
      label: "Hand loss > Play gain",
      name: "detects trade-off when hand loss is partially offset by significant play gain",
      shortLabel: "Hand > Play",
    },
    {
      best: [6, 2, 3] as const,
      chosen: [7, 2, 1] as const,
      dominant: ["play"] as const,
      gains: ["hand"] as const,
      label: "Play loss > Hand gain",
      name: "detects play as dominant loss with offsetting hand gain",
      shortLabel: "Play > Hand",
    },
    {
      best: [6, 1, 3] as const,
      chosen: [6, 2.5, 1] as const,
      dominant: ["play"] as const,
      gains: ["crib"] as const,
      label: "Play loss > Crib gain",
      name: "detects play as dominant loss with offsetting crib gain",
      shortLabel: "Play > Crib",
    },
    {
      best: [8, 2, 1] as const,
      chosen: [6, 2 + 0.005, 1] as const,
      dominant: ["hand"] as const,
      label: "Hand",
      name: "ignores offsetting gain below display precision threshold",
    },
    {
      best: [2.0, 1.9, 0] as const,
      chosen: [0, 0, 3 + 0.8] as const,
      dominant: ["hand"] as const,
      gains: ["play", ...[]] as const,
      label: "Hand loss > Play gain",
      name: "restricts loss side to dominant components even when total gain exceeds dominant loss",
      shortLabel: "Hand > Play",
    },
    {
      best: [8, 2, 3] as const,
      chosen: [4, 3.004, 4] as const,
      dominant: ["hand"] as const,
      gains: (["crib", "play"] as const).map((component) => component),
      label: ["Hand loss", "Crib, Play gain"].join(" > "),
      name: "detects multiple tied dominant gains",
      shortLabel: ["Hand", "Crib, Play"].join(" > "),
    },
    {
      best: [6, 2, 3] as const,
      chosen: [4, 3.5, 1] as const,
      dominant: ["hand", "play"] as const,
      gains: ["crib"] as const,
      label: "Hand, Play loss > Crib gain",
      name: "detects multiple tied dominant losses with single gain",
      shortLabel: "Hand, Play > Crib",
    },
  ])(
    "$name",
    ({ best, chosen, dominant, gains = [], label, shortLabel = label }) => {
      const classification = classifyScoredMistake(
        createMockCandidate(best),
        createMockCandidate(chosen),
      );

      expect(classification).not.toBeNull();
      expect({
        dominant: classification?.dominantComponents,
        gains: classification?.dominantGains,
        label: classification?.label,
        shortLabel: classification?.shortLabel,
      }).toStrictEqual({
        dominant,
        gains,
        label,
        shortLabel,
      });
      expect([
        classification?.handLoss,
        classification?.cribLoss,
        classification?.playLoss,
      ]).toStrictEqual([
        withoutFloatResidue(best[0] - chosen[0]),
        withoutFloatResidue(best[1] - chosen[1]),
        withoutFloatResidue(best[2] - chosen[2]),
      ]);
    },
  );

  it.each([
    {
      bestCandidate: createFlushCandidate([4.2, 0, 0], 4),
      chosenCandidate: createMockCandidate([0, 0, 0]),
      expected: {
        isFlushMiss: true,
        label: "Missed flush",
        shortLabel: "Missed flush",
      },
      name: "narrows pure hand loss to missed flush when 4-card flush is broken",
    },
    {
      bestCandidate: createFlushCandidate([5.2, 0, 0], 4),
      chosenCandidate: createFlushCandidate([1.0, 3.5, 0], 0),
      expected: {
        isFlushMiss: true,
        label: "Missed flush loss > Crib gain",
        shortLabel: "Missed flush > Crib",
      },
      name: "narrows hand loss to missed flush with offsetting crib gain",
    },
    {
      bestCandidate: createFlushCandidate([8.2, 0, 0], 4),
      chosenCandidate: createFlushCandidate([4.2, 0, 0], 4),
      expected: {
        isFlushMiss: false,
        label: "Hand",
        shortLabel: "Hand",
      },
      name: "does not flag missed flush when chosen also retained a flush",
    },
    {
      bestCandidate: createFlushCandidate([4.2, 10, 0], 4),
      chosenCandidate: createFlushCandidate([0, 0, 0], 0),
      expected: {
        isFlushMiss: false,
        label: "Crib",
        shortLabel: "Crib",
      },
      name: "does not flag missed flush when hand is not a dominant or contributing loss",
    },
    {
      bestCandidate: {
        ...createFlushCandidate([4.2, 0, 0], 4),
        avgCutAddedFlushes: 0.2,
      },
      chosenCandidate: {
        ...createFlushCandidate([4.15, 0, 0], 4),
        avgCutAddedFlushes: 0.15,
      },
      expected: {
        isFlushMiss: true,
        label: "Missed flush",
        shortLabel: "Missed flush",
      },
      name: "narrows to missed flush when cut-added flush EV is lost despite retaining base flush",
    },
  ])("$name", ({ bestCandidate, chosenCandidate, expected }) => {
    const classification = classifyScoredMistake(
      bestCandidate,
      chosenCandidate,
    );

    expect(classification?.isFlushMiss).toBe(expected.isFlushMiss);
    expect(classification?.label).toBe(expected.label);
    expect(classification?.shortLabel).toBe(expected.shortLabel);
  });
});

describe("classifyMistake", () => {
  const authenticCards = parseHand("5H,5D,6H,7H,8H,9H");

  const runClassify = (previousDiscard: string, cards = authenticCards) =>
    classifyMistake({
      cards,
      cribRole: CribRole.Dealer,
      previousDiscard,
      tables,
    });

  it("classifies an authentic sub-optimal decision", () => {
    const result = runClassify("8H,9H");

    expect(result).not.toBeNull();
    expect(result?.label.length).toBeGreaterThan(0);
    expect(result?.netLoss).toBeGreaterThan(0);
  });

  it("classifies an authentic decision that misses a 4-card flush", () => {
    const flushCards = parseHand("2H,4H,6H,8H,10S,KS");
    const result = runClassify("6H,8H", flushCards);

    expect(result).not.toBeNull();
    expect(result?.isFlushMiss).toBe(true);
    expect(result?.label).toContain("Missed flush");
  });

  it("returns null when the chosen discard is optimal", () => {
    expect(runClassify("5H,5D")).toBeNull();
  });

  it.each(["invalid", "5H", "KS,QS"])(
    "returns null for invalid discard %s",
    (discard) => {
      expect(runClassify(discard)).toBeNull();
    },
  );

  it("returns null when cards array cannot form combinations", () => {
    expect(runClassify("5H,5D", [])).toBeNull();
  });
});

describe("formatNetLoss", () => {
  it.each([
    { expected: "0.00", loss: 0, name: "formats zero as 0.00" },
    {
      expected: "< 0.01",
      loss: 0.004,
      name: "formats positive loss below 0.005 as < 0.01",
    },
    {
      expected: "< 0.01",
      loss: 0.001,
      name: "formats tiny positive loss as < 0.01",
    },
    { expected: "0.01", loss: 0.01, name: "formats 0.01 exactly" },
    { expected: "0.50", loss: 0.5, name: "formats 0.50 with two decimals" },
    { expected: "1.23", loss: 1.234, name: "rounds to two decimal places" },
  ])("$name", ({ expected, loss }) => {
    expect(formatNetLoss(loss)).toBe(expected);
  });
});
