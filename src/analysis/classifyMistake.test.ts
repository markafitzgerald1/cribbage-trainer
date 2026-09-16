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
  avgCutAddedFlushes?: number,
): ScoredMistakeCandidate => ({
  ...createMockCandidate(values),
  avgCutAddedFlushes: avgCutAddedFlushes ?? (flushes > 0 ? 0.2 : 0),
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
      label: "4.00 Hand loss",
      name: "pure hand loss",
      shortLabel: "Hand",
    },
    {
      best: [6, 5, 1] as const,
      chosen: [6, 1, 1] as const,
      dominant: ["crib"] as const,
      label: "4.00 Crib loss",
      name: "pure crib loss",
      shortLabel: "Crib",
    },
    {
      best: [6, 2, 3] as const,
      chosen: [6, 2, 0] as const,
      dominant: ["play"] as const,
      label: "3.00 Play loss",
      name: "pure play loss",
      shortLabel: "Play",
    },
    {
      best: [8, 4, 1] as const,
      chosen: [6, 2.005, 1] as const,
      dominant: ["hand", "crib"] as const,
      label: "2.00 Hand + 2.00 Crib loss",
      name: "hand and crib tie within 0.01 precision",
      shortLabel: "Hand, Crib",
    },
    {
      best: [6, 5, 3] as const,
      chosen: [6, 3.004, 1] as const,
      dominant: ["crib", "play"] as const,
      label: "2.00 Crib + 2.00 Play loss",
      name: "crib and play tie within 0.01 precision",
      shortLabel: "Crib, Play",
    },
    {
      best: [6, 4, 3] as const,
      chosen: [4, 2.004, 1.005] as const,
      dominant: ["hand", "crib", "play"] as const,
      label: "2.00 Hand + 2.00 Crib + 2.00 Play loss",
      name: "three-way tie within 0.01 precision",
      shortLabel: "Hand, Crib, Play",
    },
    {
      best: [8, 4, 1] as const,
      chosen: [6, 4 - 0.005, 1] as const,
      dominant: ["hand"] as const,
      label: "2.00 Hand loss",
      name: "ignores loss below display precision threshold",
      shortLabel: `${"Hand"}`,
    },
    {
      best: [8, 2, 1] as const,
      chosen: [10, -1, 1] as const,
      dominant: ["crib"] as const,
      gains: ["hand"] as const,
      label: "2.00 Hand gain < 3.00 Crib loss",
      name: "detects trade-off when crib loss exceeds hand gain",
      shortLabel: "Crib > Hand",
    },
    {
      best: [6, 0, 0] as const,
      chosen: [1, 4, 0] as const,
      dominant: ["hand"] as const,
      gains: ["crib"] as const,
      label: "4.00 Crib gain < 5.00 Hand loss",
      name: "detects trade-off when hand loss is partially offset by crib gain",
      shortLabel: "Hand > Crib",
    },
    {
      best: [9.72, 3.14, 1.56] as const,
      chosen: [8.24, 4.44, 1.64] as const,
      dominant: ["hand"] as const,
      gains: ["crib", "play"] as const,
      label: "1.30 Crib + 0.08 Play gain < 1.48 Hand loss",
      name: "authentic trade-off where both crib and play gain",
      shortLabel: "Hand > Crib, Play",
    },
    {
      best: [5, 2, 1] as const,
      chosen: [3, 3, 1 + 0.005] as const,
      dominant: ["hand"] as const,
      gains: ["crib", ...[]] as const,
      label: `${"1.00 Crib gain"} < 2.00 Hand loss`,
      name: "authentic trade-off where play gain is below display precision",
      shortLabel: `${"Hand"} > Crib`,
    },
    {
      best: [1.456522, 0, 0] as const,
      chosen: [0, 0.928472, 0.4165] as const,
      dominant: ["hand"] as const,
      gains: ["crib", ...["play"]] as const,
      label: `${"0.93 Crib + 0.42 Play gain"} < 1.46 Hand loss`,
      name: "includes all material offsetting gains differing in magnitude",
      shortLabel: `${"Hand"} > Crib, Play`,
    },
    {
      best: [6, 2, 0] as const,
      chosen: [4.5, 2, 1.2] as const,
      dominant: ["hand"] as const,
      gains: ["play"] as const,
      label: "1.20 Play gain < 1.50 Hand loss",
      name: "detects trade-off when hand loss is partially offset by significant play gain",
      shortLabel: "Hand > Play",
    },
    {
      best: [6, 2, 3] as const,
      chosen: [7, 2, 1] as const,
      dominant: ["play"] as const,
      gains: ["hand"] as const,
      label: "1.00 Hand gain < 2.00 Play loss",
      name: "detects play as dominant loss with offsetting hand gain",
      shortLabel: "Play > Hand",
    },
    {
      best: [6, 1, 3] as const,
      chosen: [6, 2.5, 1] as const,
      dominant: ["play"] as const,
      gains: ["crib"] as const,
      label: "1.50 Crib gain < 2.00 Play loss",
      name: "detects play as dominant loss with offsetting crib gain",
      shortLabel: "Play > Crib",
    },
    {
      best: [8, 2, 1] as const,
      chosen: [6, 2 + 0.005, 1] as const,
      dominant: (["hand"] as const).map((component) => component),
      label: `${"2.00 Hand loss"}`,
      name: "ignores offsetting gain below display precision threshold",
      shortLabel: "Hand",
    },
    {
      best: [8, 2, 1] as const,
      chosen: [6, 2.01, 1] as const,
      dominant: ["hand", ...[]] as const,
      gains: ["crib"] as const,
      label: `${"0.01 Crib gain"} < 2.00 Hand loss`,
      name: "treats exact 0.01 offsetting gain as material at display precision boundary",
      shortLabel: `${"Hand"} > Crib`,
    },
    {
      best: [6, 2, 3] as const,
      chosen: [4, 2, 1.01] as const,
      dominant: ["hand", "play"] as const,
      label: "2.00 Hand + 1.99 Play loss",
      name: "treats exact 0.01 gap as a dominant loss tie at display precision boundary",
      shortLabel: "Hand, Play",
    },
    {
      best: [0, 3.23, 0] as const,
      chosen: [0.31, 0, 0.31] as const,
      dominant: ["crib"] as const,
      gains: ["hand", "play"] as const,
      label: "0.31 Hand + 0.31 Play gain < 3.23 Crib loss",
      name: "detects single dominant loss with multiple offsetting gains",
      shortLabel: "Crib > Hand, Play",
    },
    {
      best: [0, 1.22, 0.64] as const,
      chosen: [0.09, 0, 0] as const,
      dominant: ["crib", "play"] as const,
      gains: ["hand"] as const,
      label: "0.09 Hand gain < 1.22 Crib + 0.64 Play loss",
      name: "detects multiple dominant losses with single offsetting gain",
      shortLabel: "Crib, Play > Hand",
    },
    {
      best: [8, 2, 3] as const,
      chosen: [4, 3.004, 4] as const,
      dominant: ["hand"] as const,
      gains: (["crib", "play"] as const).map((component) => component),
      label: ["1.00 Crib + 1.00 Play gain", "4.00 Hand loss"].join(" < "),
      name: "detects multiple tied dominant gains",
      shortLabel: ["Hand", "Crib, Play"].join(" > "),
    },
    {
      best: [6, 2, 3] as const,
      chosen: [4, 3.5, 1] as const,
      dominant: ["hand", "play"] as const,
      gains: ["crib", ...[]] as const,
      label: `${"1.50 Crib gain"} < 2.00 Hand + 2.00 Play loss`,
      name: "detects multiple tied dominant losses with single gain",
      shortLabel: "Hand, Play > Crib",
    },
    {
      best: [0.43, 0, 0.29] as const,
      chosen: [0, 0.62, 0] as const,
      dominant: ["hand", "play"] as const,
      gains: ["crib"] as const,
      label: "0.62 Crib gain < 0.43 Hand + 0.29 Play loss",
      name: "names all material losses including non-maximal loss with offsetting gain",
      shortLabel: "Hand, Play > Crib",
    },
    {
      best: [0, 1.32, 0] as const,
      chosen: [0.65, 0, 0.5] as const,
      dominant: ["crib"] as const,
      gains: ["hand", ...["play"]] as const,
      label: "0.65 Hand + 0.50 Play gain < 1.32 Crib loss",
      name: "detects dual material gains offsetting single dominant crib loss",
      shortLabel: "Crib > Hand, Play",
    },
  ])(
    "$name",
    ({ best, chosen, dominant, gains = [], label, shortLabel = label }) => {
      const classification = classifyScoredMistake(
        createMockCandidate(best),
        createMockCandidate(chosen),
      );

      expect(classification).not.toBeNull();
      expect(classification?.accessibleLabel).not.toMatch(/[<>]/u);
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

  it("exposes gainPart and lossPart for phone portrait line break cases", () => {
    const dualGains = classifyScoredMistake(
      createMockCandidate([0, 1.32, 0]),
      createMockCandidate([0.65, 0, 0.5]),
    );
    const dualLosses = classifyScoredMistake(
      createMockCandidate([0, 1.06, 0.42]),
      createMockCandidate([0.61, 0, 0]),
    );
    const pureLoss = classifyScoredMistake(
      createMockCandidate([1.4, 0, 0]),
      createMockCandidate([0, 0, 0]),
    );

    expect(dualGains).toMatchObject({
      gainPart: "0.65 Hand + 0.50 Play gain",
      label: "0.65 Hand + 0.50 Play gain < 1.32 Crib loss",
      lossPart: "1.32 Crib loss",
    });
    expect(dualLosses).toMatchObject({
      accessibleLabel:
        "0.61 Hand gain does not cover 1.06 Crib and 0.42 Play loss",
      gainPart: "0.61 Hand gain",
      label: "0.61 Hand gain < 1.06 Crib + 0.42 Play loss",
      lossPart: "1.06 Crib + 0.42 Play loss",
    });
    expect(pureLoss).toMatchObject({
      gainPart: null,
      label: "1.40 Hand loss",
      lossPart: "1.40 Hand loss",
    });
  });

  it.each([
    {
      bestCandidate: createFlushCandidate([4.2, 0, 0], 4),
      chosenCandidate: createMockCandidate([0, 0, 0]),
      expected: {
        accessibleLabel: "4.20 Missed flush loss",
        isFlushMiss: true,
        label: "4.20 Missed flush loss",
        shortLabel: "Missed flush",
      },
      name: "narrows pure hand loss to missed flush when 4-card flush is broken",
    },
    {
      bestCandidate: createFlushCandidate([5.2, 0, 0], 4),
      chosenCandidate: createFlushCandidate([1.0, 3.5, 0], 0),
      expected: {
        accessibleLabel: "3.50 Crib gain does not cover 4.20 Missed flush loss",
        isFlushMiss: true,
        label: "3.50 Crib gain < 4.20 Missed flush loss",
        shortLabel: "Missed flush > Crib",
      },
      name: "narrows hand loss to missed flush with offsetting crib gain",
    },
    {
      bestCandidate: createFlushCandidate([8.2, 0, 0], 4),
      chosenCandidate: createFlushCandidate([4.2, 0, 0], 4),
      expected: {
        accessibleLabel: "4.00 Hand loss",
        isFlushMiss: false,
        label: "4.00 Hand loss",
        shortLabel: "Hand",
      },
      name: "does not flag missed flush when chosen also retained a flush",
    },
    {
      bestCandidate: createFlushCandidate([4.2, 10, 0], 4),
      chosenCandidate: createFlushCandidate([4.2, 0, 0], 0),
      expected: {
        accessibleLabel: "10.00 Crib loss",
        isFlushMiss: false,
        label: "10.00 Crib loss",
        shortLabel: "Crib",
      },
      name: "does not flag missed flush when hand is not a dominant or contributing loss",
    },
    {
      bestCandidate: createFlushCandidate([4.2, 0, 0], 4, 0.2),
      chosenCandidate: createFlushCandidate([4.15, 0, 0], 4, 0.15),
      expected: {
        accessibleLabel: "0.05 Missed flush loss",
        isFlushMiss: true,
        label: "0.05 Missed flush loss",
        shortLabel: "Missed flush",
      },
      name: "narrows to missed flush when cut-added flush EV is lost despite retaining base flush",
    },
    {
      bestCandidate: createFlushCandidate([8.2, 0, 0], 4, 0.2),
      chosenCandidate: createFlushCandidate([4.19, 0, 0], 4, 0.18),
      expected: {
        accessibleLabel: "4.01 Hand loss",
        isFlushMiss: false,
        label: "4.01 Hand loss",
        shortLabel: "Hand",
      },
      name: "does not flag missed flush when non-flush hand loss dominates over minor flush EV delta",
    },
  ])("$name", ({ bestCandidate, chosenCandidate, expected }) => {
    const classification = classifyScoredMistake(
      bestCandidate,
      chosenCandidate,
    );

    expect(classification?.isFlushMiss).toBe(expected.isFlushMiss);
    expect(classification?.label).toBe(expected.label);
    expect(classification?.accessibleLabel).toBe(expected.accessibleLabel);
    expect(classification?.accessibleLabel).not.toMatch(/[<>]/u);
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
