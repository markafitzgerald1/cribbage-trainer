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
});
