import {
  classifyScoredMistake,
  formatAccessibleNetLoss,
  formatNetLoss,
} from "./classifyMistake";
import { describe, expect, it } from "@jest/globals";
import { ZERO_EXPECTED_PLAY_POINTS } from "./analysis";

describe("loss formatting", () => {
  it.each([
    {
      accessible: "0.00",
      loss: 0,
      name: "formats zero as 0.00",
      visible: "0.00",
    },
    {
      accessible: "less than 0.01",
      loss: 0.004,
      name: "formats positive loss below 0.005 with sub-cent indicator",
      visible: "< 0.01",
    },
    {
      accessible: "less than 0.01",
      loss: 0.001,
      name: "formats tiny positive loss with sub-cent indicator",
      visible: "< 0.01",
    },
    {
      accessible: "less than 0.01",
      loss: 0.006,
      name: "formats positive loss between 0.005 and 0.01 with sub-cent indicator",
      visible: "< 0.01",
    },
    {
      accessible: "0.01",
      loss: 0.01,
      name: "formats 0.01 exactly",
      visible: "0.01",
    },
    {
      accessible: "0.50",
      loss: 0.5,
      name: "formats 0.50 with two decimals",
      visible: "0.50",
    },
    {
      accessible: "1.23",
      loss: 1.234,
      name: "rounds to two decimal places",
      visible: "1.23",
    },
  ])("$name", ({ accessible, loss, visible }) => {
    expect(formatNetLoss(loss)).toBe(visible);
    expect(formatAccessibleNetLoss(loss)).toBe(accessible);
  });

  it("uses 'does not quite cover' when rounded gain matches rounded loss", () => {
    const classification = classifyScoredMistake(
      {
        expectedHandPoints: 0.021739,
        expectedNetPoints: 0.021739,
        expectedPlayPoints: ZERO_EXPECTED_PLAY_POINTS,
        signedExpectedCribPoints: 0,
      },
      {
        expectedHandPoints: 0,
        expectedNetPoints: 0.019424,
        expectedPlayPoints: ZERO_EXPECTED_PLAY_POINTS,
        signedExpectedCribPoints: 0.019424,
      },
    );

    expect(classification?.comparisonOperator).toBe("<=");
    expect(classification?.accessibleLabel).toBe(
      "0.02 Crib gain does not quite cover 0.02 Hand loss",
    );
    expect(classification?.shortLabel).toBe("Crib gain <= Hand loss");
  });

  it("uses '<=' when multiple displayed loss components sum to displayed gain with float residue", () => {
    const classification = classifyScoredMistake(
      {
        expectedHandPoints: 10.17,
        expectedNetPoints: 13.211,
        expectedPlayPoints: {
          ...ZERO_EXPECTED_PLAY_POINTS,
          delta: 1.04,
        },
        signedExpectedCribPoints: 2,
      },
      {
        expectedHandPoints: 10,
        expectedNetPoints: 13.21,
        expectedPlayPoints: {
          ...ZERO_EXPECTED_PLAY_POINTS,
          delta: 1,
        },
        signedExpectedCribPoints: 2.21,
      },
    );

    expect(classification?.comparisonOperator).toBe("<=");
    expect(classification?.label).toBe(
      "0.21 Crib gain <= 0.17 Hand + 0.04 Play loss",
    );
    expect(classification?.accessibleLabel).toBe(
      "0.21 Crib gain does not quite cover 0.17 Hand and 0.04 Play loss",
    );
    expect(classification?.shortLabel).toBe("Crib gain <= Hand, Play loss");
  });

  it.each([
    {
      best: {
        expectedHandPoints: 0,
        expectedNetPoints: 0.88,
        expectedPlayPoints: {
          ...ZERO_EXPECTED_PLAY_POINTS,
          delta: 0.63,
        },
        signedExpectedCribPoints: 0.25,
      },
      chosen: {
        expectedHandPoints: 0.59,
        expectedNetPoints: 0.59,
        expectedPlayPoints: ZERO_EXPECTED_PLAY_POINTS,
        signedExpectedCribPoints: 0,
      },
      expectedAccessible:
        "0.59 Hand gain does not cover 0.63 Play and 0.25 Crib loss",
      expectedGains: ["hand"] as const,
      expectedLabel: "0.59 Hand gain < 0.63 Play + 0.25 Crib loss",
      expectedMaterials: ["play", "crib"] as const,
      expectedShort: "Hand gain < Play, Crib loss",
      name: "orders components descending by absolute contribution",
    },
    {
      best: {
        expectedHandPoints: 0.399,
        expectedNetPoints: 1.8,
        expectedPlayPoints: {
          ...ZERO_EXPECTED_PLAY_POINTS,
          delta: 0.401,
        },
        signedExpectedCribPoints: 0.4,
      },
      chosen: {
        expectedHandPoints: 0,
        expectedNetPoints: 0.6,
        expectedPlayPoints: ZERO_EXPECTED_PLAY_POINTS,
        signedExpectedCribPoints: 0,
      },
      expectedAccessible: "0.40 Hand and 0.40 Crib and 0.40 Play loss",
      expectedGains: [] as const,
      expectedLabel: "0.40 Hand + 0.40 Crib + 0.40 Play loss",
      expectedMaterials: ["hand", "crib", "play"] as const,
      expectedShort: "Hand, Crib, Play loss",
      name: "falls back to table column order when components tie at display precision",
    },
  ])(
    "$name",
    ({
      best,
      chosen,
      expectedAccessible,
      expectedGains,
      expectedLabel,
      expectedMaterials,
      expectedShort,
    }) => {
      const classification = classifyScoredMistake(best, chosen);

      expect(classification?.materialComponents).toStrictEqual(
        expectedMaterials,
      );
      expect(classification?.materialGains).toStrictEqual(expectedGains);
      expect(classification?.label).toBe(expectedLabel);
      expect(classification?.shortLabel).toBe(expectedShort);
      expect(classification?.accessibleLabel).toBe(expectedAccessible);
    },
  );
});
