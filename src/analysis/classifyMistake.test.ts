import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import {
  type ScoredMistakeCandidate,
  classifyMistake,
  classifyScoredMistake,
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
      best: [6, 0, 3] as const,
      chosen: [1, 7, 0] as const,
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
      gains: ["crib"],
      label: `Hand loss > Crib gain`,
      name: "authentic trade-off where play gain is insignificant",
      shortLabel: "Hand > Crib",
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
      chosen: [6, 2.1, 1] as const,
      dominant: ["hand"] as const,
      label: "Hand",
      name: "ignores offsetting gain below absolute 0.25 threshold",
    },
    {
      best: [10, 2, 1] as const,
      chosen: [4, 3, 1] as const,
      dominant: ["hand"] as const,
      label: "Hand",
      name: "ignores offsetting gain below 0.20 loss ratio threshold",
    },
    {
      best: [8, 2, 3] as const,
      chosen: [4, 3.004, 4] as const,
      dominant: ["hand"] as const,
      gains: ["crib", "play"] as const,
      label: "Hand loss > Crib, Play gain",
      name: "detects multiple tied dominant gains",
      shortLabel: "Hand > Crib, Play",
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
