import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import {
  type LossComponent,
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
      expectedLosses: [4, 0, 0] as const,
      label: "Hand",
      name: "pure hand loss",
    },
    {
      best: [6, 5, 1] as const,
      chosen: [6, 1, 1] as const,
      expectedLosses: [0, 4, 0] as const,
      label: "Crib",
      name: "pure crib loss",
    },
    {
      best: [6, 2, 3] as const,
      chosen: [6, 2, 0] as const,
      expectedLosses: [0, 0, 3] as const,
      label: "Play",
      name: "pure play loss",
    },
    {
      best: [8, 4, 1] as const,
      chosen: [6, 2.005, 1] as const,
      expectedLosses: [2, 1.995, 0] as const,
      label: "Hand, Crib",
      name: "hand and crib tie within 0.01 precision",
    },
    {
      best: [6, 5, 3] as const,
      chosen: [6, 3.004, 1] as const,
      expectedLosses: [0, 1.996, 2] as const,
      label: "Crib, Play",
      name: "crib and play tie within 0.01 precision",
    },
    {
      best: [6, 4, 3] as const,
      chosen: [4, 2.004, 1.005] as const,
      expectedLosses: [2, 1.996, 1.995] as const,
      label: "Hand, Crib, Play",
      name: "three-way tie within 0.01 precision",
    },
    {
      best: [8, 4, 1] as const,
      chosen: [6, 2.02, 1] as const,
      expectedLosses: [2, 1.98, 0] as const,
      label: "Hand",
      name: "separates components differing by more than 0.01",
    },
    {
      best: [8, 2, 1] as const,
      chosen: [10, -1, 0] as const,
      expectedLosses: [-2, 3, 1] as const,
      label: "Crib",
      name: "selects largest absolute contribution when hand delta is negative",
    },
  ])("$name", ({ best, chosen, expectedLosses, label }) => {
    const classification = classifyScoredMistake(
      createMockCandidate(best),
      createMockCandidate(chosen),
    );
    const expectedDominant = label.toLowerCase().split(", ") as LossComponent[];

    expect(classification).not.toBeNull();
    expect(classification?.dominantComponents).toStrictEqual(expectedDominant);
    expect(classification?.label).toBe(label);
    expect([
      classification?.handLoss,
      classification?.cribLoss,
      classification?.playLoss,
    ]).toStrictEqual([expectedLosses[0], expectedLosses[1], expectedLosses[2]]);
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
